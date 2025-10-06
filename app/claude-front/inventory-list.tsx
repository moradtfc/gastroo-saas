import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, ChevronDown, Plus, MoreVertical } from 'lucide-react';

interface Article {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number | string;
  unit: string;
  image?: string;
}

const InventoryList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([
    {
      id: 1,
      name: 'Aceite de Oliva Italiano',
      category: 'Despensa',
      price: 13.00,
      stock: 20000,
      unit: 'L',
      image: '🫒'
    },
    {
      id: 2,
      name: 'Carne de Ternera',
      category: 'Carnes',
      price: 15.50,
      stock: 'Disponible',
      unit: 'kg',
      image: '🥩'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelectAll = () => {
    if (selectedItems.length === articles.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(articles.map(a => a.id));
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const toggleMenu = (id: number) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleEdit = (article: Article) => {
    console.log('Editar:', article);
    setOpenMenuId(null);
  };

  const handleUpdateCategory = (article: Article) => {
    console.log('Actualizar categoría:', article);
    setOpenMenuId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Banner de información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              i
            </div>
            <span className="text-gray-700">
              <strong>¿Ya tienes artículos?</strong> Sube un catálogo para empezar.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-blue-600 font-medium hover:text-blue-700">
              Importar colección
            </button>
            <button className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2">
            Categoría
          </button>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2">
            Estado
          </button>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2">
            <Filter size={18} />
            Todos los filtros
          </button>
          
          <button className="px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2">
            Acciones
            <ChevronDown size={18} />
          </button>
          
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Crear artículo
          </button>
        </div>

        {/* Tabla de artículos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Enlace para crear artículo rápidamente */}
          <div className="border-b border-gray-200 p-4">
            <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium">
              <Plus size={18} />
              Crear artículo rápidamente
            </button>
          </div>

          {/* Encabezados de tabla */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-700">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.length === articles.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300"
              />
            </div>
            <div className="col-span-4">Nombre</div>
            <div className="col-span-3">Categoría</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Stock</div>
          </div>

          {/* Filas de artículos */}
          {articles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 items-center"
            >
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(article.id)}
                  onChange={() => toggleSelectItem(article.id)}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </div>
              
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-2xl">
                  {article.image}
                </div>
                <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                  {article.name}
                </span>
              </div>
              
              <div className="col-span-3 text-gray-700">
                {article.category}
              </div>
              
              <div className="col-span-2 text-gray-700">
                {article.price.toFixed(2)} €/{article.unit}
              </div>
              
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-gray-700">
                  {typeof article.stock === 'number' 
                    ? `${article.stock.toLocaleString()} ${article.unit}`
                    : article.stock}
                </span>
                <div className="relative" ref={openMenuId === article.id ? menuRef : null}>
                  <button 
                    onClick={() => toggleMenu(article.id)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {openMenuId === article.id && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      <button
                        onClick={() => handleEdit(article)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleUpdateCategory(article)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm"
                      >
                        Actualizar categoría
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;