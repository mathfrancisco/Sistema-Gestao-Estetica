// lib/services/ai-pricing.service.ts
import { supabase } from '@/lib/database/supabase/client'
import type { ProcedureWithCategory } from '@/types/procedure.types'

// ===== TIPOS PARA O SISTEMA REAL =====
interface MarketData {
    id: string
    procedure_name: string
    category: string
    region: string
    min_price: number
    max_price: number
    avg_price: number
    source: string
    confidence: number
    competitor_name?: string
    competitor_url?: string
    data_quality: 'high' | 'medium' | 'low'
    created_at: string
    embedding?: number[]
}

interface PricingInsight {
    suggested_price: number
    confidence: 'low' | 'medium' | 'high'
    reasoning: string[]
    market_position: 'below' | 'competitive' | 'premium'
    risk_level: 'low' | 'medium' | 'high'
    recommendations: string[]
    competitors_found: number
    market_analysis: {
        avg_competitor_price: number
        price_range: { min: number; max: number }
        your_position_percentile: number
    }
}

interface BrowseAIResponse {
    status: string
    result: {
        capturedLists: {
            [key: string]: Array<{
                [field: string]: string
            }>
        }
    }
}

// ===== SERVIÇO PRINCIPAL =====
export class AIPricingService {

    // ===== BROWSE AI INTEGRATION =====
    private static async collectMarketData(
        procedureName: string,
        category: string,
        region: string = 'sao-paulo'
    ): Promise<MarketData[]> {
        const BROWSE_AI_API_KEY = process.env.NEXT_PUBLIC_BROWSE_AI_API_KEY

        if (!BROWSE_AI_API_KEY) {
            console.warn('Browse AI API key not configured')
            return []
        }

        try {
            // Sites para buscar preços (configure seus robots no Browse AI)
            const searchQueries = [
                `${procedureName} preço ${region}`,
                `${category} procedimento valor ${region}`,
                `estética ${procedureName} tabela preços`
            ]

            const allData: MarketData[] = []

            for (const query of searchQueries) {
                // Robot IDs - você precisa criar estes robots no Browse AI
                const robotIds = [
                    'robot_clinicas_estetica', // Para sites de clínicas
                    'robot_tabela_precos',     // Para tabelas de preços
                    'robot_marketplace_estetica' // Para marketplaces
                ]

                for (const robotId of robotIds) {
                    try {
                        const data = await this.executeBrowseAIRobot(robotId, query)
                        if (data.length > 0) {
                            allData.push(...data)
                        }
                    } catch (error) {
                        console.warn(`Robot ${robotId} failed for query "${query}":`, error)
                    }
                }
            }

            return allData
        } catch (error) {
            console.error('Error collecting market data:', error)
            return []
        }
    }

    private static async executeBrowseAIRobot(
        robotId: string,
        searchQuery: string
    ): Promise<MarketData[]> {
        const BROWSE_AI_API_KEY = process.env.NEXT_PUBLIC_BROWSE_AI_API_KEY!

        try {
            // Executar robot
            const runResponse = await fetch(`https://api.browse.ai/v2/robots/${robotId}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${BROWSE_AI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputParameters: {
                        search_query: searchQuery,
                        location: 'BR' // Brasil
                    }
                })
            })

            if (!runResponse.ok) {
                throw new Error(`Browse AI run failed: ${runResponse.statusText}`)
            }

            const runData = await runResponse.json()
            const taskId = runData.result.id

            // Aguardar resultado (com timeout)
            return await this.waitForBrowseAIResult(robotId, taskId)

        } catch (error) {
            console.error(`Error executing robot ${robotId}:`, error)
            return []
        }
    }

    private static async waitForBrowseAIResult(
        robotId: string,
        taskId: string,
        maxWaitTime: number = 30000 // 30 segundos
    ): Promise<MarketData[]> {
        const BROWSE_AI_API_KEY = process.env.NEXT_PUBLIC_BROWSE_AI_API_KEY!
        const startTime = Date.now()

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await fetch(`https://api.browse.ai/v2/robots/${robotId}/tasks/${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${BROWSE_AI_API_KEY}`,
                    }
                })

                if (!response.ok) {
                    throw new Error(`Failed to get task result: ${response.statusText}`)
                }

                const data: BrowseAIResponse = await response.json()

                if (data.status === 'successful') {
                    return this.parseBrowseAIResults(data)
                } else if (data.status === 'failed') {
                    throw new Error('Browse AI task failed')
                }

                // Aguardar 2 segundos antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 2000))

            } catch (error) {
                console.error('Error waiting for Browse AI result:', error)
                break
            }
        }

        throw new Error('Browse AI task timeout')
    }

    private static parseBrowseAIResults(data: BrowseAIResponse): MarketData[] {
        const results: MarketData[] = []

        try {
            // Adaptar conforme estrutura dos seus robots
            const capturedData = data.result.capturedLists

            // Lista de preços capturada
            if (capturedData.precos) {
                capturedData.precos.forEach((item: any) => {
                    const price = this.extractPrice(item.preco || item.valor || item.price)
                    const procedureName = item.procedimento || item.servico || item.nome || ''
                    const competitor = item.clinica || item.empresa || item.fonte || ''

                    if (price > 0 && procedureName) {
                        results.push({
                            id: `browse_${Date.now()}_${Math.random()}`,
                            procedure_name: procedureName,
                            category: this.categorizeService(procedureName),
                            region: 'sao-paulo',
                            min_price: price * 0.8, // Estimativa de variação
                            max_price: price * 1.2,
                            avg_price: price,
                            source: 'browse_ai',
                            confidence: 0.8,
                            competitor_name: competitor,
                            competitor_url: item.url || '',
                            data_quality: 'high',
                            created_at: new Date().toISOString()
                        })
                    }
                })
            }

            // Tabelas de preços
            if (capturedData.tabela_precos) {
                capturedData.tabela_precos.forEach((item: any) => {
                    const price = this.extractPrice(item.valor)
                    if (price > 0) {
                        results.push({
                            id: `browse_table_${Date.now()}_${Math.random()}`,
                            procedure_name: item.servico || item.procedimento,
                            category: this.categorizeService(item.servico || item.procedimento),
                            region: 'sao-paulo',
                            min_price: price,
                            max_price: price,
                            avg_price: price,
                            source: 'browse_ai_table',
                            confidence: 0.9,
                            data_quality: 'high',
                            created_at: new Date().toISOString()
                        })
                    }
                })
            }

        } catch (error) {
            console.error('Error parsing Browse AI results:', error)
        }

        return results
    }

    private static extractPrice(priceText: string): number {
        if (!priceText) return 0

        // Extrair números do texto: "R$ 150,00" -> 150
        const cleaned = priceText.replace(/[^\d,.-]/g, '')
        const normalized = cleaned.replace(',', '.')
        const price = parseFloat(normalized)

        return isNaN(price) ? 0 : price
    }

    private static categorizeService(serviceName: string): string {
        const name = serviceName.toLowerCase()

        if (name.includes('facial') || name.includes('limpeza') || name.includes('peeling')) {
            return 'Facial'
        } else if (name.includes('massagem') || name.includes('corporal') || name.includes('drenagem')) {
            return 'Corporal'
        } else if (name.includes('laser') || name.includes('radio') || name.includes('microagulhamento')) {
            return 'Tecnológico'
        }

        return 'Geral'
    }

    // ===== GEMINI 2.5 FLASH =====
    private static async callGemini25Flash(prompt: string): Promise<string> {
        const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY

        if (!API_KEY) {
            throw new Error('Gemini API key not configured')
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1, // Mais conservador para análise financeira
                        topK: 40,
                        topP: 0.8,
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json" // Forçar resposta JSON
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            })

            if (!response.ok) {
                throw new Error(`Gemini 2.5 Flash API error: ${response.statusText}`)
            }

            const data = await response.json()
            return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        } catch (error) {
            console.error('Erro na API Gemini 2.5 Flash:', error)
            throw error
        }
    }

    // ===== ANÁLISE INTELIGENTE REAL =====
    static async generatePricingInsight(
        procedure: ProcedureWithCategory,
        targetMargin: number = 50,
        strategy: 'economy' | 'competitive' | 'premium' = 'competitive',
        region: string = 'sao-paulo'
    ): Promise<PricingInsight> {
        try {
            console.log(`🤖 Analisando preço para: ${procedure.name}`)

            // 1. Coletar dados reais de mercado
            const marketData = await this.collectMarketData(
                procedure.name,
                procedure.procedure_categories?.name || 'geral',
                region
            )

            // 2. Buscar dados similares no vector store
            const similarData = await this.findSimilarProcedures(
                procedure.name,
                procedure.procedure_categories?.name || 'geral',
                region
            )

            // 3. Salvar novos dados de mercado
            for (const data of marketData) {
                await this.saveMarketData(data)
            }

            // 4. Preparar contexto para Gemini 2.5 Flash
            const allMarketData = [...marketData, ...similarData]
            const competitorAnalysis = this.analyzeCompetitors(allMarketData)

            const prompt = `
Você é um especialista em precificação de procedimentos estéticos com acesso a dados reais de mercado.

DADOS DO PROCEDIMENTO:
- Nome: ${procedure.name}
- Categoria: ${procedure.procedure_categories?.name || 'Não categorizado'}
- Preço atual: R$ ${procedure.price.toFixed(2)}
- Custo: R$ ${(procedure.cost || 0).toFixed(2)}
- Duração: ${procedure.duration_minutes} minutos
- Margem alvo: ${targetMargin}%
- Estratégia: ${strategy}
- Região: ${region}

DADOS REAIS DE MERCADO COLETADOS:
${allMarketData.length > 0 ?
                allMarketData.map(d =>
                    `- ${d.competitor_name || 'Concorrente'}: ${d.procedure_name} = R$ ${d.avg_price.toFixed(2)} (confiança: ${(d.confidence * 100).toFixed(0)}%)`
                ).join('\n')
                : 'Nenhum dado de mercado específico encontrado'}

ANÁLISE DE CONCORRÊNCIA:
- Concorrentes encontrados: ${competitorAnalysis.competitors_count}
- Preço médio do mercado: R$ ${competitorAnalysis.avg_price.toFixed(2)}
- Faixa de preços: R$ ${competitorAnalysis.min_price.toFixed(2)} - R$ ${competitorAnalysis.max_price.toFixed(2)}
- Sua posição atual: ${competitorAnalysis.your_position}

INSTRUÇÕES:
1. Analise os dados REAIS de mercado coletados
2. Calcule um preço sugerido baseado em:
   - Margem de lucro desejada (${targetMargin}%)
   - Posicionamento competitivo real
   - Duração e complexidade do procedimento
   - Estratégia escolhida (${strategy})

3. Determine:
   - Nível de confiança baseado na quantidade/qualidade dos dados
   - Posição de mercado (below/competitive/premium)
   - Nível de risco da precificação
   - 5 recomendações específicas e acionáveis

Responda APENAS em JSON válido:
{
  "suggested_price": 150.00,
  "confidence": "high|medium|low",
  "reasoning": [
    "Análise baseada em X concorrentes reais",
    "Margem calculada considerando custo de R$ Y",
    "Posicionamento competitivo na faixa Z do mercado"
  ],
  "market_position": "below|competitive|premium",
  "risk_level": "low|medium|high", 
  "recommendations": [
    "Recomendação específica 1",
    "Recomendação específica 2",
    "Recomendação específica 3",
    "Recomendação específica 4",
    "Recomendação específica 5"
  ],
  "competitors_found": ${competitorAnalysis.competitors_count},
  "market_analysis": {
    "avg_competitor_price": ${competitorAnalysis.avg_price},
    "price_range": {
      "min": ${competitorAnalysis.min_price},
      "max": ${competitorAnalysis.max_price}
    },
    "your_position_percentile": ${competitorAnalysis.percentile}
  }
}
`

            // 5. Chamar Gemini 2.5 Flash
            const aiResponse = await this.callGemini25Flash(prompt)

            // 6. Parse da resposta
            const insight = this.parseAIResponse(aiResponse, procedure, competitorAnalysis)

            // 7. Salvar insight
            await this.savePricingInsight(procedure.id, insight)

            console.log(`✅ Análise concluída para ${procedure.name}`)
            return insight

        } catch (error) {
            console.error('Erro na análise de IA:', error)
            return this.fallbackPricingAnalysis(procedure, targetMargin, strategy)
        }
    }

    // ===== ANÁLISE DE CONCORRENTES =====
    private static analyzeCompetitors(marketData: MarketData[]) {
        if (marketData.length === 0) {
            return {
                competitors_count: 0,
                avg_price: 0,
                min_price: 0,
                max_price: 0,
                your_position: 'unknown',
                percentile: 50
            }
        }

        const prices = marketData.map(d => d.avg_price).filter(p => p > 0)
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)

        return {
            competitors_count: marketData.length,
            avg_price: avgPrice,
            min_price: minPrice,
            max_price: maxPrice,
            your_position: 'competitive', // Será calculado no prompt
            percentile: 50 // Será calculado pela IA
        }
    }

    // ===== VECTOR STORE OPERATIONS =====
    private static async generateEmbedding(text: string): Promise<number[]> {
        try {
            const { data, error } = await supabase.functions.invoke('generate-embedding', {
                body: { text }
            })

            if (error) throw error
            return data.embedding
        } catch (error) {
            console.error('Erro ao gerar embedding:', error)
            return this.createSimpleEmbedding(text)
        }
    }

    private static createSimpleEmbedding(text: string): number[] {
        const words = text.toLowerCase().split(' ')
        const embedding = new Array(384).fill(0)

        words.forEach((word, index) => {
            const hash = this.simpleHash(word)
            embedding[hash % 384] += 1 / (index + 1)
        })

        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
        return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
    }

    private static simpleHash(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return Math.abs(hash)
    }

    static async findSimilarProcedures(
        procedureName: string,
        category: string,
        region: string = 'sao-paulo',
        limit: number = 5
    ): Promise<MarketData[]> {
        try {
            const searchText = `${procedureName} ${category} ${region}`
            const embedding = await this.generateEmbedding(searchText)

            const { data, error } = await supabase.rpc('match_market_data', {
                query_embedding: embedding,
                match_threshold: 0.6, // Reduzido para encontrar mais resultados
                match_count: limit
            })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Erro ao buscar dados similares:', error)
            return []
        }
    }

    static async saveMarketData(marketData: Omit<MarketData, 'id' | 'created_at' | 'embedding'>): Promise<void> {
        try {
            const searchText = `${marketData.procedure_name} ${marketData.category} ${marketData.region}`
            const embedding = await this.generateEmbedding(searchText)

            const { error } = await supabase
                .from('market_data')
                .upsert({
                    ...marketData,
                    embedding,
                    created_at: new Date().toISOString()
                }, {
                    onConflict: 'procedure_name,region,source',
                    ignoreDuplicates: false
                })

            if (error) throw error
        } catch (error) {
            console.error('Erro ao salvar dados de mercado:', error)
        }
    }

    // ===== PARSE E FALLBACK =====
    private static parseAIResponse(
        response: string,
        procedure: ProcedureWithCategory,
        competitorAnalysis: any
    ): PricingInsight {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/)
            if (!jsonMatch) throw new Error('JSON não encontrado')

            const parsed = JSON.parse(jsonMatch[0])

            return {
                suggested_price: parsed.suggested_price || procedure.price,
                confidence: parsed.confidence || 'medium',
                reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : ['Análise baseada em algoritmo'],
                market_position: parsed.market_position || 'competitive',
                risk_level: parsed.risk_level || 'medium',
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                competitors_found: competitorAnalysis.competitors_count,
                market_analysis: {
                    avg_competitor_price: competitorAnalysis.avg_price,
                    price_range: {
                        min: competitorAnalysis.min_price,
                        max: competitorAnalysis.max_price
                    },
                    your_position_percentile: parsed.market_analysis?.your_position_percentile || 50
                }
            }
        } catch (error) {
            console.error('Erro ao fazer parse da resposta:', error)
            return this.fallbackPricingAnalysis(procedure, 50, 'competitive')
        }
    }

    private static fallbackPricingAnalysis(
        procedure: ProcedureWithCategory,
        targetMargin: number,
        strategy: string
    ): PricingInsight {
        const cost = procedure.cost || 0
        const duration = procedure.duration_minutes

        let basePrice = cost > 0 ? cost / (1 - targetMargin / 100) : (duration / 60) * 120
        const strategyMultipliers = { economy: 0.85, competitive: 1.0, premium: 1.25 }
        const finalPrice = basePrice * strategyMultipliers[strategy as keyof typeof strategyMultipliers]

        return {
            suggested_price: Math.round(finalPrice),
            confidence: 'low',
            reasoning: [
                'IA indisponível - usando algoritmo de fallback',
                cost > 0 ? `Baseado na margem de ${targetMargin}%` : `Baseado na duração de ${duration} min`,
                'Configure APIs para análises mais precisas'
            ],
            market_position: 'competitive',
            risk_level: 'medium',
            recommendations: [
                'Configure Browse AI para dados de mercado',
                'Verifique configuração do Gemini API',
                'Defina custos precisos para melhor análise'
            ],
            competitors_found: 0,
            market_analysis: {
                avg_competitor_price: finalPrice,
                price_range: { min: finalPrice * 0.8, max: finalPrice * 1.2 },
                your_position_percentile: 50
            }
        }
    }

    private static async savePricingInsight(procedureId: string, insight: PricingInsight): Promise<void> {
        try {
            const { error } = await supabase
                .from('pricing_insights')
                .insert({
                    procedure_id: procedureId,
                    suggested_price: insight.suggested_price,
                    confidence: insight.confidence,
                    reasoning: insight.reasoning,
                    market_position: insight.market_position,
                    risk_level: insight.risk_level,
                    recommendations: insight.recommendations,
                    ai_model: 'gemini-2.5-flash',
                    created_at: new Date().toISOString()
                })

            if (error) throw error
        } catch (error) {
            console.error('Erro ao salvar insight:', error)
        }
    }

    // ===== ATUALIZAÇÃO AUTOMÁTICA DE DADOS =====
    static async updateMarketDataAuto(): Promise<void> {
        try {
            console.log('🔄 Iniciando atualização automática de dados de mercado...')

            // Buscar procedimentos ativos para coletar dados
            const { data: procedures, error } = await supabase
                .from('procedures')
                .select('name, procedure_categories(name)')
                .eq('is_active', true)
                .limit(10) // Limitar para não sobrecarregar APIs

            if (error) throw error

            for (const proc of procedures || []) {
                try {
                    const marketData = await this.collectMarketData(
                        proc.name,
                        proc.procedure_categories?.name || 'geral'
                    )

                    for (const data of marketData) {
                        await this.saveMarketData(data)
                    }

                    // Aguardar para não sobrecarregar APIs
                    await new Promise(resolve => setTimeout(resolve, 5000))
                } catch (error) {
                    console.warn(`Erro ao coletar dados para ${proc.name}:`, error)
                }
            }

            console.log('✅ Atualização de dados de mercado concluída')
        } catch (error) {
            console.error('Erro na atualização automática:', error)
        }
    }
}

// ===== HOOK PERSONALIZADO =====
export function useAIPricing() {
    const generateInsight = async (
        procedure: ProcedureWithCategory,
        options?: {
            targetMargin?: number
            strategy?: 'economy' | 'competitive' | 'premium'
            region?: string
        }
    ) => {
        return AIPricingService.generatePricingInsight(
            procedure,
            options?.targetMargin,
            options?.strategy,
            options?.region
        )
    }

    const updateMarketData = async () => {
        return AIPricingService.updateMarketDataAuto()
    }

    return {
        generateInsight,
        updateMarketData
    }
}