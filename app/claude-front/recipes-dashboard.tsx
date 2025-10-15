import React, { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, TrendingUp, Copy, Trash2, Clock, Users, Package, DollarSign } from 'lucide-react';

interface Recipe {
  id: number;
  name: string;
  categories: string[];
  description: string;
  servings: number;
  preparationTime: number;
  ingredientsCount: number;
  totalCost: number;
  costPerServing: number;
  profitMargin: number;
  difficulty: 'Fácil' | 'Intermedio' | 'Difícil';
  image: string;
}

const RecipesDashboard: React.FC = () => {
  const [recipes] = useState<Recipe[]>([
    {
      id: 1,
      name: 'Paella Valenciana',
      categories: ['Arroces', 'Plato Principal'],
      description: 'Tradicional paella valenciana con pollo, conejo y verduras frescas de temporada',
      servings: 4,
      preparationTime: 60,
      ingredientsCount: 12,
      totalCost: 28.50,
      costPerServing: 7.13,
      profitMargin: 65,
      difficulty: 'Intermedio',
      image: 'https://images.unsplash.com/photo-1630175860521-8c9c4fc44ea7?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      name: 'Gazpacho Andaluz',
      categories: ['Sopas', 'Entrantes'],
      description: 'Refrescante sopa fría de tomate, pepino y pimientos, perfecta para el verano',
      servings: 6,
      preparationTime: 15,
      ingredientsCount: 8,
      totalCost: 12.00,
      costPerServing: 2.00,
      profitMargin: 75,
      difficulty: 'Fácil',
      image: 'https://images.unsplash.com/photo-1583224964748-a159e7c538c2?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      name: 'Risotto de Setas',
      categories: ['Arroces', 'Vegetariano'],
      description: 'Cremoso risotto con mezcla de setas silvestres y queso parmesano',
      servings: 4,
      preparationTime: 45,
      ingredientsCount: 10,
      totalCost: 22.00,
      costPerServing: 5.50,
      profitMargin: 70,
      difficulty: 'Difícil',
      image: 'https://images.unsplash.com/photo-1476124369491-c4071349cfaa?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      name: 'Tarta de Santiago',
      categories: ['Postres', 'Repostería'],
      description: 'Tradicional tarta gallega de almendras con su característico símbolo',
      servings: 8,
      preparationTime: 50,
      ingredientsCount: 6,
      totalCost: 15.00,
      costPerServing: 1.88,
      profitMargin: 80,
      difficulty: 'Fácil',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      name: 'Pulpo a la Gallega',
      categories: ['Mariscos', 'Plato Principal'],
      description: 'Pulpo cocido con pimentón, aceite de oliva y patatas cocidas',
      servings: 4,
      preparationTime: 90,
      ingredientsCount: 5,
      totalCost: 45.00,
      costPerServing: 11.25,
      profitMargin: 55,
      difficulty: 'Intermedio',
      image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      name: 'Crema Catalana',
      categories: ['Postres'],
      description: 'Postre tradicional catalán con crema pastelera y azúcar caramelizado',
      servings: 6,
      preparationTime: 30,
      ingredientsCount: 7,
      totalCost: 9.50,
      costPerServing: 1.58,
      profitMargin: 82,
      difficulty: 'Fácil',
      image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop'
    },
    {
      id: 7,
      name: 'Cocido Madrileño',
      categories: ['Guisos', 'Plato Principal'],
      description: 'Contundente guiso tradicional con garbanzos, carnes y verduras',
      servings: 6,
      preparationTime: 120,
      ingredientsCount: 15,
      totalCost: 35.00,
      costPerServing: 5.83,
      profitMargin: 68,
      difficulty: 'Intermedio',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      name: 'Ensalada César',
      categories: ['Ensaladas', 'Entrantes'],
      description: 'Clásica ensalada con lechuga, pollo, parmesano y salsa césar casera',
      servings: 4,
      preparationTime: 20,
      ingredientsCount: 9,
      totalCost: 14.50,
      costPerServing: 3.63,
      profitMargin: 72,
      difficulty: 'Fácil',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const totalRecipes = recipes.length;
  const averageMargin = recipes.reduce((acc, r) => acc + r.profitMargin, 0) / recipes.length;
  const totalCost = recipes.reduce((acc, r) => acc + r.totalCost, 0);
  const averageTime = Math.round(recipes.reduce((acc, r) => acc + r.preparationTime, 0) / recipes.length);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Intermedio':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Difícil':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProfitMarginColor = (margin: number): string => {
    if (margin >= 70) return 'text-green-600';
    if (margin >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleView = (recipe: Recipe): void => {
    console.log('Ver receta:', recipe);
  };

  const handleEdit = (recipe: Recipe): void => {
    console.log('Editar receta:', recipe);
  };

  const handleScale = (recipe: Recipe): void => {
    console.log('Escalar receta:', recipe);
  };

  const handleDuplicate = (recipe: Recipe): void => {
    console.log('Duplicar receta:', recipe);
  };

  const handleDelete = (recipe: Recipe): void => {
    console.log('Eliminar receta:', recipe);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Recetas</h1>
          <p className="text-gray-600">Administra y organiza todas tus recetas</p>
        </div>

        {/* Estadísticas con gráficas minimalistas */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{totalRecipes}</p>
                <p className="text-xs text-gray-500 mt-1">Total Recetas</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{averageMargin.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Margen Promedio</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${averageMargin}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{totalCost.toFixed(0)}€</p>
                <p className="text-xs text-gray-500 mt-1">Costo Total</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{averageTime}</p>
                <p className="text-xs text-gray-500 mt-1">Min Promedio</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(averageTime / 120) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all">
            <Filter size={18} />
            Filtros
          </button>
          
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
            <Plus size={20} />
            Nueva Receta
          </button>
        </div>

        {/* Grid de recetas - 4 columnas en desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
            >
              {/* Imagen de cabecera */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={recipe.image} 
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {recipe.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {recipe.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-gray-600 text-xs line-clamp-2">
                    {recipe.description}
                  </p>
                </div>

                {/* Métricas compactas */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users size={14} className="text-blue-500" />
                    <span>{recipe.servings} rac.</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} className="text-blue-500" />
                    <span>{recipe.preparationTime} min</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Package size={14} className="text-blue-500" />
                    <span>{recipe.ingredientsCount} ing.</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign size={14} className="text-blue-500" />
                    <span>{recipe.totalCost.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Información financiera */}
                <div className="space-y-2 mb-3 text-xs border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Costo/ración</span>
                    <span className="font-semibold text-gray-800">{recipe.costPerServing.toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Margen</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${getProfitMarginColor(recipe.profitMargin)}`}>
                        {recipe.profitMargin}%
                      </span>
                      <span className={`font-semibold ${getProfitMarginColor(recipe.profitMargin)}`}>
                        ({(recipe.costPerServing * recipe.profitMargin / 100).toFixed(2)}€)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 pt-3 border-t border-gray-100 mt-auto">
                  <button
                    onClick={() => handleView(recipe)}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium"
                    title="Ver"
                  >
                    <Eye size={14} />
                  </button>
                  
                  <button
                    onClick={() => handleEdit(recipe)}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium"
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  
                  <button
                    onClick={() => handleScale(recipe)}
                    className="flex-1 px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium"
                    title="Escalar"
                  >
                    <TrendingUp size={14} />
                  </button>
                  
                  <button
                    onClick={() => handleDuplicate(recipe)}
                    className="px-2 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center text-xs font-medium"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(recipe)}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center text-xs font-medium"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecipesDashboard;