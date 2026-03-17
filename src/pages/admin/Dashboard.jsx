import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Car, CreditCard, Ticket } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ocupacion: 0,
    recaudacion: 0,
    ticketsHoy: 0
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen Diario</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ocupación Actual</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ocupacion}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-green-100 text-green-600 rounded-lg mr-4">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Recaudación Hoy</p>
            <p className="text-2xl font-bold text-gray-900">${stats.recaudacion}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-lg mr-4">
            <Ticket className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tickets Emitidos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ticketsHoy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
