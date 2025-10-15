import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Percent, Package } from 'lucide-react';

const App: React.FC = () => {
  // Datos de ejemplo de una receta
  const costoTotal = 5.60;
  const racionesEstimadas = 50;
  
  const [nombreReceta] = useState("Ensalada César Premium");
  const [precioVenta, setPrecioVenta] = useState(8.90);
  
  // Cálculos automáticos basados en el precio de venta
  const gananciaPorRacion = precioVenta - costoTotal;
  const margenGanancia = ((gananciaPorRacion / precioVenta) * 100).toFixed(0);
  const gananciaTotalEstimada = (gananciaPorRacion * racionesEstimadas).toFixed(2);

  const pieData = [
    { name: 'Costo', value: costoTotal, color: '#ef4444' },
    { name: 'Ganancia', value: gananciaPorRacion, color: '#10b981' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        
        {/* Encabezado */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Análisis de Rentabilidad
            </h2>
            <p className="text-gray-600">{nombreReceta}</p>
          </div>

          {/* Input de precio de venta */}
          <div className="max-w-sm mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de venta por ración
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold text-gray-800 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Costo por ración: €{costoTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Gráfica circular */}
        <div className="mb-8">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centro de la dona - eliminado */}

          {/* Leyenda personalizada */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Costo: €{costoTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Ganancia: €{gananciaPorRacion.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-700">
              €{gananciaPorRacion.toFixed(2)}
            </p>
            <p className="text-xs text-green-600 mt-1">Por ración</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
              <Percent className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {margenGanancia}%
            </p>
            <p className="text-xs text-blue-600 mt-1">Margen</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-2">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700">
              €{gananciaTotalEstimada}
            </p>
            <p className="text-xs text-purple-600 mt-1">Ganancia total</p>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Estimación:</span> Basado en {racionesEstimadas} raciones. 
            Tu margen de {margenGanancia}% está dentro del rango recomendado para este tipo de producto.
          </p>
        </div>


      </div>
    </div>
  );
};

export default App;