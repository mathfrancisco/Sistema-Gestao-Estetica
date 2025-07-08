// supabase/functions/generate-embedding/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbeddingRequest {
    text: string
    model?: string
    language?: string
}

interface EmbeddingResponse {
    embedding: number[]
    model: string
    tokens: number
    processing_time_ms: number
    quality_score: number
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const startTime = Date.now()

    try {
        const {
            text,
            model = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
            language = 'pt'
        }: EmbeddingRequest = await req.json()

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required and cannot be empty' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Preprocessing do texto em português
        const processedText = preprocessPortugueseText(text)

        let embedding: number[]
        let modelUsed: string
        let qualityScore: number

        try {
            // Tentar Hugging Face primeiro (melhor qualidade)
            console.log('🤖 Tentando Hugging Face...')
            const hfResult = await generateHuggingFaceEmbedding(processedText, model)
            embedding = hfResult.embedding
            modelUsed = `huggingface:${model}`
            qualityScore = 0.95
            console.log('✅ Hugging Face sucesso')
        } catch (hfError) {
            console.warn('⚠️ Hugging Face falhou, tentando OpenAI...', hfError.message)

            try {
                // Fallback para OpenAI
                const openaiResult = await generateOpenAIEmbedding(processedText)
                embedding = openaiResult.embedding
                modelUsed = 'openai:text-embedding-ada-002'
                qualityScore = 0.9
                console.log('✅ OpenAI sucesso')
            } catch (openaiError) {
                console.warn('⚠️ OpenAI falhou, usando embedding local...', openaiError.message)

                // Fallback final para embedding local otimizado
                embedding = generateOptimizedLocalEmbedding(processedText, language)
                modelUsed = 'local:optimized-pt'
                qualityScore = 0.7
                console.log('✅ Embedding local sucesso')
            }
        }

        const processingTime = Date.now() - startTime

        const response: EmbeddingResponse = {
            embedding,
            model: modelUsed,
            tokens: countTokens(processedText),
            processing_time_ms: processingTime,
            quality_score: qualityScore
        }

        console.log(`✅ Embedding gerado: ${embedding.length}D em ${processingTime}ms`)

        return new Response(
            JSON.stringify(response),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('❌ Erro geral:', error)

        return new Response(
            JSON.stringify({
                error: 'Failed to generate embedding',
                details: error.message,
                processing_time_ms: Date.now() - startTime
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

// ===== PREPROCESSING PARA PORTUGUÊS =====
function preprocessPortugueseText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Decomposição de caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, ' ') // Remove pontuação
        .replace(/\b(de|da|do|das|dos|em|na|no|nas|nos|para|por|com|sem|sobre|entre|durante|desde|até|antes|depois|dentro|fora|acima|abaixo|perto|longe|muito|pouco|mais|menos|sempre|nunca|hoje|ontem|amanhã)\b/g, '') // Remove stop words
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim()
}

function countTokens(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length
}

// ===== HUGGING FACE (GRATUITO - MELHOR QUALIDADE) =====
async function generateHuggingFaceEmbedding(
    text: string,
    model: string
): Promise<{ embedding: number[] }> {
    const HF_API_TOKEN = Deno.env.get('HUGGING_FACE_TOKEN')

    const modelEndpoint = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (HF_API_TOKEN) {
        headers['Authorization'] = `Bearer ${HF_API_TOKEN}`
    }

    const response = await fetch(modelEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            inputs: text,
            options: {
                wait_for_model: true,
                use_cache: true
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`)
    }

    const embeddings = await response.json()

    if (Array.isArray(embeddings) && embeddings.length > 0) {
        return { embedding: embeddings[0] }
    }

    throw new Error('Invalid embedding format from Hugging Face')
}

// ===== OPENAI (PAGO - ALTA QUALIDADE) =====
async function generateOpenAIEmbedding(text: string): Promise<{ embedding: number[] }> {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            input: text,
            model: 'text-embedding-ada-002'
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return { embedding: data.data[0].embedding }
}

// ===== EMBEDDING LOCAL OTIMIZADO (FALLBACK) =====
function generateOptimizedLocalEmbedding(text: string, language: string = 'pt', dimensions: number = 384): number[] {
    const words = text.split(' ').filter(word => word.length > 1)
    const embedding = new Array(dimensions).fill(0)

    // Features linguísticas específicas do português
    const features = extractPortugueseFeatures(text, words)

    // Distribuir features pelo embedding
    words.forEach((word, index) => {
        const wordHash = simpleHash(word)
        const weight = 1 / Math.sqrt(index + 1) // Peso decrescente

        // Posições baseadas em hash da palavra
        const positions = [
            wordHash % dimensions,
            (wordHash * 7) % dimensions,
            (wordHash * 13) % dimensions,
            (wordHash * 19) % dimensions
        ]

        positions.forEach(pos => {
            embedding[pos] += weight
        })

        // Adicionar informação de bigramas
        if (index < words.length - 1) {
            const bigramHash = simpleHash(word + words[index + 1])
            embedding[bigramHash % dimensions] += weight * 0.5
        }
    })

    // Adicionar features linguísticas
    Object.entries(features).forEach(([feature, value], index) => {
        const featurePos = (simpleHash(feature) % (dimensions / 4)) + (dimensions * 3 / 4)
        embedding[Math.floor(featurePos)] += value * 0.1
    })

    // Normalização L2
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))

    if (magnitude > 0) {
        return embedding.map(val => val / magnitude)
    }

    return embedding
}

function extractPortugueseFeatures(text: string, words: string[]): Record<string, number> {
    const features: Record<string, number> = {}

    // Características básicas
    features.length = Math.min(words.length / 50, 1) // Normalizado
    features.avg_word_length = words.reduce((sum, w) => sum + w.length, 0) / words.length / 10

    // Características específicas do português
    features.vowel_density = (text.match(/[aeiouáéíóúàèìòùâêîôûãõ]/g) || []).length / text.length
    features.consonant_clusters = (text.match(/[bcdfgjklmnpqrstvwxyz]{2,}/g) || []).length / words.length

    // Padrões morfológicos portugueses
    features.diminutives = words.filter(w => w.endsWith('inho') || w.endsWith('inha')).length / words.length
    features.plurals = words.filter(w => w.endsWith('s') && w.length > 3).length / words.length
    features.gerunds = words.filter(w => w.endsWith('ando') || w.endsWith('endo')).length / words.length

    // Características semânticas para estética
    const aestheticTerms = ['pele', 'facial', 'corpo', 'beleza', 'tratamento', 'procedimento', 'estetica', 'clinica', 'massagem', 'limpeza']
    features.aesthetic_relevance = words.filter(w =>
        aestheticTerms.some(term => w.includes(term))
    ).length / words.length

    // Características de preço/negócio
    const businessTerms = ['preco', 'valor', 'custo', 'investimento', 'promocao', 'desconto', 'pacote']
    features.business_relevance = words.filter(w =>
        businessTerms.some(term => w.includes(term))
    ).length / words.length

    return features
}

function simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
}

// ===== ALTERNATIVE: TENSORFLOW.JS (SE QUISER USAR MODELOS LOCAIS) =====
/*
import * as tf from 'https://cdn.skypack.dev/@tensorflow/tfjs'

async function generateTensorFlowEmbedding(text: string): Promise<number[]> {
  // Carregar modelo Universal Sentence Encoder
  const model = await tf.loadLayersModel('https://tfhub.dev/google/universal-sentence-encoder/4')

  // Processar texto
  const embeddings = await model.predict(tf.tensor([text]))
  const embedding = await embeddings.data()

  return Array.from(embedding)
}
*/

/*
===== INSTRUÇÕES DE DEPLOY =====

1. Criar a função:
   ```bash
   supabase functions new generate-embedding
   ```

2. Copiar este código para: supabase/functions/generate-embedding/index.ts

3. Configurar secrets (opcional):
   ```bash
   # Hugging Face (gratuito, recomendado)
   supabase secrets set HUGGING_FACE_TOKEN=hf_xxxxxxxx

   # OpenAI (pago, alta qualidade)
   supabase secrets set OPENAI_API_KEY=sk-xxxxxxxx
   ```

4. Deploy:
   ```bash
   supabase functions deploy generate-embedding
   ```

5. Testar:
   ```bash
   curl -X POST 'https://seu-projeto.supabase.co/functions/v1/generate-embedding' \
     -H 'Authorization: Bearer sua_anon_key' \
     -H 'Content-Type: application/json' \
     -d '{"text": "limpeza de pele facial procedimento estético"}'
   ```

===== MODELOS RECOMENDADOS =====

Para português brasileiro:
- sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (GRATUITO)
- neuralmind/bert-base-portuguese-cased (GRATUITO)
- sentence-transformers/distiluse-base-multilingual-cased (GRATUITO)

Para qualidade máxima (pago):
- OpenAI text-embedding-ada-002
- Cohere embed-multilingual-v2.0

===== PERFORMANCE ESPERADA =====

Hugging Face: ~1-3 segundos, qualidade alta
OpenAI: ~0.5-1 segundo, qualidade máxima
Local: ~0.1 segundos, qualidade média

O sistema sempre funciona, mesmo sem APIs externas!
*/