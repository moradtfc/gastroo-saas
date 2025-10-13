import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface AdditionalCost {
  id: number;
  name: string;
  amount: number;
}

interface Instruction {
  id: number;
  step: number;
  description: string;
}

const CreateRecipeForm: React.FC = () => {
  const [recipeName, setRecipeName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [servings, setServings] = useState<number>(4);
  const [preparationHours, setPreparationHours] = useState<number>(0);
  const [preparationMinutes, setPreparationMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<string>('Fácil');
  const [description, setDescription] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#FF9D3D');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [headerScrolled, setHeaderScrolled] = useState<boolean>(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([
    { id: 1, name: 'Mano de Obra', amount: 0 },
    { id: 2, name: 'Servicios', amount: 0 }
  ]);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: 0,
    unit: 'g',
    cost: 0
  });

  const colors = [
    '#999999', '#991B4F', '#E31E24', '#F26649', '#FF9D3D', '#FFD500',
    '#A67C52', '#5C4A3C', '#2D7A3E', '#00C853', '#00BFA5', '#2979FF',
    '#448AFF', '#7C4DFF', '#E91E63'
  ];

  useEffect(() => {
    const handleScroll = (): void => {
      const titleElement = contentRef.current?.querySelector('h1');
      if (titleElement) {
        const titlePosition = titleElement.getBoundingClientRect();
        setHeaderScrolled(titlePosition.bottom < 80);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name: string): string => {
    if (!name || name.trim() === '') return '';
    const trimmed = name.trim();
    return trimmed.substring(0, 2).toUpperCase();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredient = (): void => {
    if (newIngredient.name && newIngredient.quantity > 0) {
      const ingredient: Ingredient = {
        id: Date.now(),
        ...newIngredient
      };
      setIngredients([...ingredients, ingredient]);
      setNewIngredient({ name: '', quantity: 0, unit: 'g', cost: 0 });
    }
  };

  const removeIngredient = (id: number): void => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const updateAdditionalCost = (id: number, amount: number): void => {
    setAdditionalCosts(additionalCosts.map(cost => 
      cost.id === id ? { ...cost, amount } : cost
    ));
  };

  const addInstruction = (): void => {
    const newInstruction: Instruction = {
      id: Date.now(),
      step: instructions.length + 1,
      description: ''
    };
    setInstructions([...instructions, newInstruction]);
  };

  const updateInstruction = (id: number, description: string): void => {
    setInstructions(instructions.map(inst =>
      inst.id === id ? { ...inst, description } : inst
    ));
  };

  const removeInstruction = (id: number): void => {
    const filtered = instructions.filter(inst => inst.id !== id);
    const reordered = filtered.map((inst, index) => ({
      ...inst,
      step: index + 1
    }));
    setInstructions(reordered);
  };

  const ingredientsCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const additionalCostTotal = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalCost = ingredientsCost + additionalCostTotal;
  const costPerServing = servings > 0 ? totalCost / servings : 0;
  const profit = sellingPrice - costPerServing;
  const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const totalPreparationTime = (preparationHours * 60) + preparationMinutes;

  const handleSubmit = (): void => {
    const recipe = {
      recipeName,
      category,
      servings,
      preparationTime: totalPreparationTime,
      difficulty,
      description,
      imageColor: selectedColor,
      ingredients,
      additionalCosts,
      totalCost,
      costPerServing,
      sellingPrice,
      profitMargin,
      instructions
    };
    console.log('Receta creada:', recipe);
  };

  const saveImageChanges = (): void => {
    setShowImageModal(false);
    document.body.style.overflow = 'auto';
  };

  const openImageModal = (): void => {
    setShowImageModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeImageModal = (): void => {
    setShowImageModal(false);
    document.body.style.overflow = 'auto';
  };

  const dropdownArrowStyle = {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 12px center'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={closeImageModal}
        >
          <div 
            className="bg-white rounded-xl w-11/12 max-w-4xl max-h-screen overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Editar imagen de la receta</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <h4 className="text-base font-semibold mb-4">Imagen</h4>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-all"
                  >
                    <div className="text-4xl mb-3">🖼️</div>
                    <div className="text-sm text-gray-600">
                      Arrastra y suelta las imágenes aquí,<br/>
                      <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                        subir o explorar biblioteca de imágenes
                      </span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <h4 className="text-base font-semibold mb-4">Color</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {colors.map((color) => (
                      <div
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`aspect-square rounded-lg cursor-pointer transition-all hover:scale-105 flex items-center justify-center ${
                          selectedColor === color ? 'ring-4 ring-gray-800' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <span className="text-white text-3xl font-bold drop-shadow-lg">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:sticky lg:top-0">
                <div className="bg-gray-100 rounded-xl p-6 text-center">
                  <div 
                    className="w-full max-w-xs mx-auto h-48 rounded-lg flex items-center justify-center text-5xl font-semibold text-white mb-4"
                    style={{ backgroundColor: imagePreview ? 'transparent' : selectedColor }}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span>{getInitials(recipeName)}</span>
                    )}
                  </div>
                  <div className="text-blue-600 font-semibold text-sm">Listo</div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-between gap-3">
              <button
                onClick={closeImageModal}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveImageChanges}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 bg-white border-b border-gray-200 z-40 transition-all">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex-1">
            <button className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors text-xl">
              ✕
            </button>
          </div>
          <div className="flex-1 text-center">
            <h2 className={`text-lg font-semibold transition-opacity ${headerScrolled ? 'opacity-100' : 'opacity-0'}`}>
              Crea una receta
            </h2>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white" ref={contentRef}>
        <div className="p-6">
          <h1 className="text-3xl font-semibold mb-6">Crea una receta</h1>

          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xl">📢</span>
              <span className="text-sm">Crea recetas detalladas con costos precisos y márgenes de ganancia</span>
            </div>
            <a href="#" className="text-blue-600 font-semibold text-sm hover:underline">Más información</a>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Información</h2>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base"
                  placeholder="Nombre"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-base resize-none"
                  rows={5}
                  placeholder="Descripción"
                />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Raciones</label>
                    <input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Tiempo de preparación</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={preparationHours}
                          onChange={(e) => setPreparationHours(Number(e.target.value))}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                          min="0"
                          max="24"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">h</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={preparationMinutes}
                          onChange={(e) => setPreparationMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                          min="0"
                          max="59"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Dificultad</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 appearance-none bg-white pr-10"
                      style={dropdownArrowStyle}
                    >
                      <option value="Fácil">Fácil</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Difícil">Difícil</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-40">
                <div 
                  onClick={openImageModal}
                  className="w-40 h-32 rounded-lg flex items-center justify-center text-5xl font-semibold text-white cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: imagePreview ? 'transparent' : selectedColor }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Recipe" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span>{getInitials(recipeName)}</span>
                  )}
                </div>
                <div 
                  onClick={openImageModal}
                  className="text-blue-600 font-semibold text-sm text-center mt-2 cursor-pointer hover:underline"
                >
                  Editar
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 appearance-none pr-10"
                style={dropdownArrowStyle}
              >
                <option value="">Seleccionar categoría</option>
                <option value="Entrantes">Entrantes</option>
                <option value="Plato Principal">Plato Principal</option>
                <option value="Postres">Postres</option>
                <option value="Sopas">Sopas</option>
                <option value="Ensaladas">Ensaladas</option>
                <option value="Arroces">Arroces</option>
                <option value="Carnes">Carnes</option>
                <option value="Pescados">Pescados</option>
                <option value="Vegetariano">Vegetariano</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Ingredientes</h2>
                <p className="text-sm text-gray-600 mt-1">Añade los ingredientes necesarios con sus cantidades y costos</p>
              </div>
              <button
                onClick={addIngredient}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Añadir ingredientes
              </button>
            </div>

            {ingredients.length > 0 && (
              <div className="space-y-2">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-gray-600">{ingredient.quantity} {ingredient.unit}</span>
                      <span className="text-gray-600">{ingredient.cost.toFixed(2)} €</span>
                    </div>
                    <button
                      onClick={() => removeIngredient(ingredient.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Costos y Análisis</h2>

            <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 mb-6">
              <span className="text-xl">💡</span>
              <span className="text-sm">Puedes crear en este apartado los costos adicionales de tu receta</span>
            </div>

            <div className="space-y-3 mb-6">
              {additionalCosts.map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <label className="flex-1 text-sm font-medium">{cost.name}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={cost.amount || ''}
                      onChange={(e) => updateAdditionalCost(cost.id, Number(e.target.value))}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-right"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-sm text-gray-600">€</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Costo de ingredientes</span>
                <span className="font-semibold">{ingredientsCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Costos adicionales</span>
                <span className="font-semibold">{additionalCostTotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-200">
                <span>Costo Total</span>
                <span className="text-blue-600">{totalCost.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                <span className="font-medium">Costo por Ración</span>
                <span className="font-bold text-blue-600">{costPerServing.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Precio y Margen de Ganancia</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Precio de Venta por Ración (€)</label>
                <input
                  type="number"
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Ganancia por Ración</p>
                  <p className="text-2xl font-bold text-green-600">{profit.toFixed(2)} €</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Margen de Ganancia</p>
                  <p className="text-4xl font-bold text-blue-600">{profitMargin.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Ganancia Total ({servings} raciones)</p>
                  <p className="text-2xl font-bold text-blue-600">{(profit * servings).toFixed(2)} €</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-8" />

          <div className="mb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Instrucciones de Preparación</h2>
                <p className="text-sm text-gray-600 mt-1">Añade los pasos detallados para preparar esta receta</p>
              </div>
              <button
                onClick={addInstruction}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Añadir
              </button>
            </div>

            <div className="space-y-3">
              {instructions.map((instruction) => (
                <div key={instruction.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {instruction.step}
                  </div>
                  <textarea
                    value={instruction.description}
                    onChange={(e) => updateInstruction(instruction.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 resize-none"
                    rows={2}
                    placeholder={`Paso ${instruction.step}: Describe la instrucción...`}
                  />
                  <button
                    onClick={() => removeInstruction(instruction.id)}
                    className="flex-shrink-0 text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRecipeForm;