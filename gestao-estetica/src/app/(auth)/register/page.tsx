// app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/database/supabase/client'
import { toast } from 'sonner'
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"

const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação de senha obrigatória')
}).refine(data => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"]
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema)
    })

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true)

        try {
            console.log('📝 Starting user registration...')

            // ✅ CORRIGIDO: Criar conta no Supabase Auth com metadados corretos
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.name,
                        name: data.name, // Backup para compatibilidade
                        email: data.email
                    }
                }
            })

            if (authError) {
                console.error('❌ Auth error:', authError)
                throw authError
            }

            if (authData.user) {
                console.log('✅ User created in auth:', {
                    id: authData.user.id,
                    email: authData.user.email,
                    metadata: authData.user.user_metadata
                })

                // ✅ CORRIGIDO: Não criar perfil manualmente - deixar o trigger fazer
                // O trigger handle_new_user() vai criar automaticamente:
                // - Registro na tabela users
                // - Registro na tabela business_profile

                // ✅ Aguardar um pouco para o trigger processar
                await new Promise(resolve => setTimeout(resolve, 1000))

                // ✅ Verificar se o perfil foi criado pelo trigger
                try {
                    const { data: userProfile, error: profileError } = await supabase
                        .from('users')
                        .select('id, email, full_name')
                        .eq('id', authData.user.id)
                        .single()

                    if (profileError) {
                        console.warn('⚠️ Profile not found immediately (may take a moment):', profileError)
                    } else {
                        console.log('✅ User profile created by trigger:', userProfile)
                    }
                } catch (verifyError) {
                    console.warn('⚠️ Could not verify profile creation:', verifyError)
                    // Não falhar o registro por causa da verificação
                }

                console.log('🎉 Registration successful!')
                toast.success('Conta criada com sucesso! Verifique seu email para confirmar.')

                // ✅ Redirecionar para login com mensagem
                router.push('/login?message=check-email')
            } else {
                throw new Error('Usuário não foi criado')
            }
        } catch (error: any) {
            console.error('❌ Registration error:', error)

            let errorMessage = 'Erro ao criar conta'

            // ✅ Tratar erros específicos do Supabase
            if (error.message === 'User already registered') {
                errorMessage = 'Este email já está cadastrado'
            } else if (error.message?.includes('Password')) {
                errorMessage = 'Senha deve ter pelo menos 6 caracteres'
            } else if (error.message?.includes('Email')) {
                errorMessage = 'Email inválido'
            } else if (error.message?.includes('weak')) {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres'
            } else if (error.message?.includes('already')) {
                errorMessage = 'Este email já está sendo usado'
            } else if (error.code === 'weak_password') {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres'
            } else if (error.code === 'user_already_exists') {
                errorMessage = 'Este email já está cadastrado'
            }

            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {/* Main Content */}
            <main className="flex-1 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
                                <UserPlus className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Crie sua conta
                            </h1>
                            <p className="text-gray-600">
                                Comece a transformar sua clínica hoje mesmo
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome completo
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        {...register('name')}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                                        placeholder="Seu nome completo"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        {...register('confirmPassword')}
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Terms */}
                            <div className="text-sm text-gray-600">
                                Ao criar uma conta, você concorda com nossos{' '}
                                <Link href="/terms" className="text-purple-600 hover:text-purple-800">
                                    Termos de Serviço
                                </Link>{' '}
                                e{' '}
                                <Link href="/privacy" className="text-purple-600 hover:text-purple-800">
                                    Política de Privacidade
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <UserPlus className="w-5 h-5 mr-2" />
                                )}
                                {isLoading ? 'Criando conta...' : 'Criar conta'}
                            </button>
                        </form>

                        {/* Links */}
                        <div className="mt-6 text-center">
                            <div className="text-sm text-gray-600">
                                Já tem uma conta?{' '}
                                <Link
                                    href="/login"
                                    className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
                                >
                                    Faça login
                                </Link>
                            </div>
                        </div>

                        {/* Debug Info (apenas em desenvolvimento) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <strong>🛠️ Debug Info:</strong>
                                <br />• Trigger automático criará perfil na tabela users
                                <br />• Business profile será criado automaticamente
                                <br />• RLS configurado para acesso seguro
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}