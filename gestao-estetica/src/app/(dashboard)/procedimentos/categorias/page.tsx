'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Tag,
    Plus,
    Search,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    RefreshCw,
    Edit,
    Trash2,
    ArrowLeft,
    Activity,
    TrendingUp,
    ChevronRight
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import {
    useProcedureCategories,
    useCreateProcedureCategory,
    useUpdateProcedureCategory,
    useDeleteProcedureCategory,
    useProcedureCategoryFilters,
    useProcedureCategoriesPagination
} from '@/lib/hooks/useProcedures'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type {
    ProcedureCategory,
    ProcedureCategoryInsert,
    ProcedureCategoryUpdate
} from '@/types/procedure.types'

const categorySchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().optional(),
    color: z.string().optional(),
    is_active: z.boolean().default(true)
})

type CategoryFormData = z.infer<typeof categorySchema>

const PREDEFINED_COLORS = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#F97316', // Orange
    '#8B5A2B'  // Brown
]

const CategoriasPage: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<ProcedureCategory | null>(null)

    // Hooks para filtros e paginação
    const { filters, searchQuery, updateSearchQuery, resetFilters } = useProcedureCategoryFilters()
    const { pagination, goToPage } = useProcedureCategoriesPagination()

    // Hooks para dados
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        refetch: refetchCategories
    } = useProcedureCategories({
        page: pagination.page,
        limit: pagination.limit,
        filters: { ...filters, search: searchQuery }
    })

    // Mutations
    const createCategory = useCreateProcedureCategory()
    const updateCategory = useUpdateProcedureCategory()
    const deleteCategory = useDeleteProcedureCategory()

    const categories = categoriesData?.data || []

    // Form setup
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            color: PREDEFINED_COLORS[0],
            is_active: true
        }
    })

    const isEditing = !!selectedCategory

    React.useEffect(() => {
        if (selectedCategory && isFormOpen) {
            setValue('name', selectedCategory.name)
            setValue('description', selectedCategory.description || '')
            setValue('color', selectedCategory.color || PREDEFINED_COLORS[0])
            setValue('is_active', selectedCategory.is_active)
        } else if (!selectedCategory && isFormOpen) {
            reset()
        }
    }, [selectedCategory, isFormOpen, setValue, reset])

    const onSubmit = async (data: CategoryFormData) => {
        try {
            if (selectedCategory) {
                await updateCategory.mutateAsync({
                    id: selectedCategory.id,
                    data: data as ProcedureCategoryUpdate
                })
            } else {
                await createCategory.mutateAsync(data as ProcedureCategoryInsert)
            }
            setIsFormOpen(false)
            setSelectedCategory(null)
            reset()
        } catch (error) {
            console.error('Erro ao salvar categoria:', error)
        }
    }

    const handleDelete = async (category: ProcedureCategory) => {
        if (window.confirm(`Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`)) {
            try {
                await deleteCategory.mutateAsync(category.id)
            } catch (error) {
                console.error('Erro ao excluir categoria:', error)
            }
        }
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativa
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                Inativa
            </Badge>
        )
    }

    // Mock stats - replace with real data from API
    const statsData = [
        {
            title: 'Total de Categorias',
            value: categories.length,
            icon: Tag,
            description: 'Todas as categorias',
            gradient: 'from-purple-500 to-purple-600'
        },
        {
            title: 'Categorias Ativas',
            value: categories.filter(c => c.is_active).length,
            icon: CheckCircle,
            description: 'Disponíveis para uso',
            gradient: 'from-emerald-500 to-emerald-600'
        },
        {
            title: 'Categorias Inativas',
            value: categories.filter(c => !c.is_active).length,
            icon: XCircle,
            description: 'Desabilitadas',
            gradient: 'from-red-500 to-red-600'
        },
        {
            title: 'Mais Utilizada',
            value: categories.length > 0 ? categories[0]?.name?.slice(0, 10) + '...' : 'N/A',
            icon: TrendingUp,
            description: 'Categoria popular',
            gradient: 'from-blue-500 to-blue-600'
        }
    ]

    if (categoriesLoading && categories.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <Sidebar />
                <div className="lg:ml-64">
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Sidebar */}
            <Sidebar />

            {/* Conteúdo Principal */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                    <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/procedimentos"
                                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                                    </Link>
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <Tag className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                        Categorias
                                    </h1>
                                </div>
                                <p className="text-slate-600 text-xs sm:text-sm font-medium">
                                    Organize seus procedimentos em categorias
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg shadow-emerald-500/25 text-xs">
                                    <Activity className="w-3 h-3 mr-1" />
                                    Online
                                </Badge>
                                <Button
                                    onClick={() => {
                                        setSelectedCategory(null)
                                        setIsFormOpen(true)
                                    }}
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Nova Categoria
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Conteúdo */}
                <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                        {/* Métricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {statsData.map((metric, index) => (
                                <Card key={index} className="relative overflow-hidden border-0 shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-slate-300/60 transition-all duration-300 hover:-translate-y-1">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-5`} />
                                    <CardContent className="p-4 lg:p-6 relative">
                                        <div className="flex items-center justify-between mb-3 lg:mb-4">
                                            <div className={`p-2 lg:p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                                                <metric.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </div>

                                        <div className="space-y-1 lg:space-y-2">
                                            <p className="text-xs lg:text-sm font-medium text-slate-600">{metric.title}</p>
                                            <p className="text-xl lg:text-3xl font-bold text-slate-900 leading-tight">
                                                {typeof metric.value === 'string' ? metric.value : metric.value.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-500">{metric.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Filtros e Busca */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Search className="w-5 h-5 text-purple-500" />
                                    Buscar Categorias
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <Input
                                                placeholder="Buscar por nome ou descrição..."
                                                value={searchQuery}
                                                onChange={(e) => updateSearchQuery(e.target.value)}
                                                className="pl-10 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                        className="bg-white border-slate-200 hover:bg-slate-50"
                                    >
                                        Limpar Filtros
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de Categorias */}
                        <Card className="border-0 shadow-xl shadow-slate-200/60 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-4 lg:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
                                        <Tag className="w-5 h-5 text-purple-500" />
                                        Categorias ({categories.length})
                                        {categoriesLoading && <RefreshCw className="w-4 h-4 animate-spin ml-2 text-purple-500" />}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                                        <Activity className="w-3 h-3 mr-1" />
                                        {categories.length} resultados
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {categories.length === 0 ? (
                                    <div className="text-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Tag className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                            Nenhuma categoria encontrada
                                        </h3>
                                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                            {searchQuery
                                                ? 'Tente ajustar a busca ou criar uma nova categoria.'
                                                : 'Comece criando sua primeira categoria de procedimentos.'
                                            }
                                        </p>
                                        <Button
                                            onClick={() => {
                                                setSelectedCategory(null)
                                                setIsFormOpen(true)
                                            }}
                                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/25 border-0"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nova Categoria
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50">
                                                    <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Descrição</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Cor</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {categories.map((category) => (
                                                    <TableRow key={category.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                {category.color && (
                                                                    <div
                                                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                                                        style={{ backgroundColor: category.color }}
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-slate-900">{category.name}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <p className="text-sm text-slate-600 max-w-xs truncate">
                                                                {category.description || 'Sem descrição'}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {category.color ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className="w-6 h-6 rounded-lg border border-slate-200"
                                                                        style={{ backgroundColor: category.color }}
                                                                    />
                                                                    <span className="text-xs font-mono text-slate-500">
                                                                        {category.color}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">Sem cor</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            {getStatusBadge(category.is_active)}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-56">
                                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setSelectedCategory(category)
                                                                            setIsFormOpen(true)
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            updateCategory.mutate({
                                                                                id: category.id,
                                                                                data: { is_active: !category.is_active }
                                                                            })
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {category.is_active ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                                                        {category.is_active ? 'Desativar' : 'Ativar'}
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDelete(category)}
                                                                        className="cursor-pointer text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Excluir
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Modal de Formulário */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <Tag className="w-4 h-4 text-white" />
                            </div>
                            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome da Categoria *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Ex: Faciais, Corporais..."
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Descrição da categoria..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cor da Categoria</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {PREDEFINED_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                                            watch('color') === color
                                                ? 'border-slate-900 scale-110 shadow-lg'
                                                : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setValue('color', color)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Categoria Ativa</Label>
                                <p className="text-xs text-slate-500">
                                    Categorias inativas não aparecerão nos formulários
                                </p>
                            </div>
                            <Switch
                                checked={watch('is_active')}
                                onCheckedChange={(checked) => setValue('is_active', checked)}
                            />
                        </div>
                    </form>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsFormOpen(false)
                                setSelectedCategory(null)
                                reset()
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleSubmit(onSubmit)}
                            disabled={createCategory.isPending || updateCategory.isPending}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                            {(createCategory.isPending || updateCategory.isPending) ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                isEditing ? 'Atualizar' : 'Criar'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CategoriasPage