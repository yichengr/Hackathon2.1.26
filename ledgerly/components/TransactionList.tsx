
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Transaction, EconomicBehavior } from '../types';
import { Filter, ArrowDownLeft, ArrowUpRight, ArrowUpDown, Plus, Trash2, X, Wallet2, ChevronDown, Repeat, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight, Map as MapIcon, Layers, Info } from 'lucide-react';
import L from 'leaflet';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type SortField = 'date' | 'amount';
type SortOrder = 'asc' | 'desc';
type ViewType = 'list' | 'calendar' | 'map';

const CATEGORIES = [
  'Shopping',
  'Food & Drink',
  'Transportation',
  'Income',
  'Groceries',
  'Entertainment',
  'Utilities',
  'Health',
  'Transfers',
  'Other'
];

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [view, setView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map State - Refs for Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [newTx, setNewTx] = useState({
    description: '', 
    amount: '', 
    category: 'Shopping', 
    date: new Date().toISOString().split('T')[0]
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleLocalAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;
    
    const amountNum = parseFloat(newTx.amount);
    
    const transaction: Transaction = {
      id: `t${Date.now()}`,
      description: newTx.description,
      amount: amountNum,
      category: newTx.category,
      merchant: newTx.description,
      date: newTx.date,
      economicBehavior: 'Normal' // Default
    };
    
    onAddTransaction(transaction);
    setNewTx({ 
      description: '', 
      amount: '', 
      category: 'Shopping', 
      date: new Date().toISOString().split('T')[0] 
    });
    setShowAddForm(false);
  };

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || t.category === filter;
      const matchesDate = selectedDate ? t.date === selectedDate : true;
      return matchesSearch && matchesFilter && matchesDate;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortField === 'date') result = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortField === 'amount') result = a.amount - b.amount;
      return sortOrder === 'asc' ? result : -result;
    });

  // --- MAP DATA PREPARATION ---
  const mapPoints = useMemo(() => {
    return transactions.filter(t => t.amount < 0 && t.location).map(t => ({
        ...t,
        lat: t.location!.lat,
        lng: t.location!.lng,
        city: t.location!.city,
        neighborhood: t.location!.neighborhood || t.location!.region
    }));
  }, [transactions]);

  // Insights Logic
  const getMapInsight = () => {
    if (mapPoints.length === 0) return "No location data available to analyze.";
    
    const luxuryCount = mapPoints.filter(p => p.economicBehavior === 'Luxury').length;
    const normalCount = mapPoints.filter(p => p.economicBehavior === 'Normal').length;
    const inferiorCount = mapPoints.filter(p => p.economicBehavior === 'Inferior').length;
    
    if (luxuryCount > normalCount && luxuryCount > inferiorCount) {
        return "Discretionary spending ('Luxury') dominates your map, particularly in high-cost districts. Consider balancing this with essential goods.";
    } else if (inferiorCount > normalCount) {
        return "A high frequency of 'Inferior' goods purchases suggests potential constraint-driven spending in your routine.";
    }
    return "Your spending is balanced with a strong foundation of 'Normal' essential goods, indicating stability in daily needs.";
  };

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    // Only initialize if we are in map view and have a container
    if (view === 'map' && mapContainerRef.current) {
        // Create map if it doesn't exist
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView([40.730610, -73.935242], 12); 
            
            // Reliable, clean base layer
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            layerGroupRef.current = L.layerGroup().addTo(map);
            mapInstanceRef.current = map;

            // FIX: Force resize to prevent gray tiles if container size wasn't ready
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }

    // Cleanup when leaving map view
    return () => {
        if (view !== 'map' && mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            layerGroupRef.current = null;
        }
    };
  }, [view]);

  // --- MAP MARKERS UPDATE ---
  useEffect(() => {
      if (view === 'map' && mapInstanceRef.current && layerGroupRef.current) {
          const layerGroup = layerGroupRef.current;
          layerGroup.clearLayers();

          let bounds = L.latLngBounds([]);
          let hasPoints = false;

          mapPoints.forEach(point => {
              hasPoints = true;
              
              // RADIUS based on amount (clamped)
              const radius = Math.min(Math.sqrt(Math.abs(point.amount)) * 0.8 + 4, 18);

              // COLOR LOGIC - Strict Economic Classification
              let color = '#3b82f6'; // Default Blue (Normal)
              let typeLabel = 'Normal';
              
              const b = point.economicBehavior || 'Normal';
              typeLabel = b;

              if (b === 'Luxury') color = '#F59E0B'; // Gold
              else if (b === 'Inferior') color = '#ef4444'; // Red/Amber
              else color = '#3b82f6'; // Muted Blue

              const marker = L.circleMarker([point.lat, point.lng], {
                  radius: radius,
                  fillColor: color,
                  color: 'white',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.8
              });

              marker.bindPopup(`
                  <div class="font-sans min-w-[160px]">
                      <div class="flex items-center justify-between mb-2">
                         <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">${point.neighborhood}</span>
                         <span class="text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm" style="background-color: ${color}">${typeLabel}</span>
                      </div>
                      <h4 class="font-bold text-slate-900 text-sm">${point.merchant}</h4>
                      <p class="text-xs text-slate-600 mb-2">${point.description}</p>
                      <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
                          <span class="font-black text-slate-900 text-base">$${Math.abs(point.amount).toFixed(2)}</span>
                          <span class="text-[10px] text-slate-400">${new Date(point.date).toLocaleDateString()}</span>
                      </div>
                  </div>
              `);

              marker.addTo(layerGroup);
              bounds.extend([point.lat, point.lng]);
          });

          // Zoom to fit all points immediately if they exist
          if (hasPoints && mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }
      }
  }, [view, mapPoints]); // Re-run when view or data changes


  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    return { daysInMonth, firstDay, year, month };
  };

  const { daysInMonth, firstDay, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getDaySpending = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const txs = transactions.filter(t => t.date === dateStr && t.amount < 0);
    const total = txs.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    return { total, hasTx: txs.length > 0 };
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setView('list');
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="p-6 lg:p-10 h-full overflow-y-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your entries and see your balance update live.</p>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-1 flex items-center shadow-sm">
                <button 
                    onClick={() => setView('list')}
                    className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-[#004879] text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                    title="List View"
                >
                    <ListIcon size={20} />
                </button>
                <button 
                    onClick={() => setView('calendar')}
                    className={`p-2 rounded-xl transition-all ${view === 'calendar' ? 'bg-[#004879] text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Calendar View"
                >
                    <CalendarIcon size={20} />
                </button>
                <button 
                    onClick={() => setView('map')}
                    className={`p-2 rounded-xl transition-all ${view === 'map' ? 'bg-[#004879] text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Geographic Map"
                >
                    <MapIcon size={20} />
                </button>
            </div>
            <button 
            onClick={() => setShowAddForm(true)} 
            className="flex items-center gap-2 px-6 py-3 bg-[#004879] text-white rounded-2xl hover:bg-[#003A6F] transition-all shadow-lg font-bold"
            >
            <Plus size={20} /> <span className="hidden sm:inline">Add Entry</span>
            </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 mb-10 animate-fade-in relative overflow-hidden">
           <div className={`absolute top-0 left-0 w-2 h-full ${parseFloat(newTx.amount) >= 0 ? 'bg-green-500' : 'bg-[#D03027]'}`}></div>
           <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
               <Plus className="text-[#004879]" /> Create New Transaction
             </h3>
             <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg"><X size={20}/></button>
           </div>
           <form onSubmit={handleLocalAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                <input type="text" placeholder="e.g. Birthday Money" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#004879]/5 focus:border-[#004879] transition-all" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#004879]/5 focus:border-[#004879] transition-all appearance-none font-medium text-slate-700"
                    value={newTx.category}
                    onChange={e => setNewTx({...newTx, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Amount ($)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Positive = Income" 
                    className={`w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#004879]/5 focus:border-[#004879] transition-all font-bold ${parseFloat(newTx.amount) >= 0 ? 'text-green-600' : 'text-slate-900'}`} 
                    value={newTx.amount} 
                    onChange={e => setNewTx({...newTx, amount: e.target.value})} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {parseFloat(newTx.amount) > 0 ? <ArrowDownLeft size={16} className="text-green-500" /> : parseFloat(newTx.amount) < 0 ? <ArrowUpRight size={16} className="text-red-500" /> : null}
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#004879]/5 focus:border-[#004879] transition-all font-medium text-slate-600" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
              </div>

              <div className="flex items-end">
                <button type="submit" className="w-full bg-[#004879] text-white font-black rounded-2xl py-4 hover:bg-[#003A6F] transition-all shadow-lg uppercase tracking-widest text-xs">Post Entry</button>
              </div>
           </form>
        </div>
      )}

      {/* --- MAP VIEW (Fixed Height & Initialization) --- */}
      {view === 'map' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col h-[700px] relative">
              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                  {/* Legend Card */}
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl w-[240px]">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                        <Layers size={14} className="text-[#004879]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Economic Behavior</span>
                      </div>
                      
                      <div className="space-y-3">
                          <div className="flex items-start gap-2.5">
                              <div className="w-3 h-3 rounded-full bg-[#3b82f6] mt-0.5 shadow-sm"></div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">Normal</span>
                                <span className="text-[10px] text-slate-400 font-medium">Essential daily goods</span>
                              </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                              <div className="w-3 h-3 rounded-full bg-[#F59E0B] mt-0.5 shadow-sm"></div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">Luxury</span>
                                <span className="text-[10px] text-slate-400 font-medium">Discretionary/Premium</span>
                              </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                              <div className="w-3 h-3 rounded-full bg-[#ef4444] mt-0.5 shadow-sm"></div>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">Inferior</span>
                                <span className="text-[10px] text-slate-400 font-medium">Constraint-driven/Substitute</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Map Canvas with Fixed Height and explicit min-height for safety */}
              <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" style={{ height: '100%', minHeight: '600px' }} />
              
              {/* Insight Footer */}
              <div className="absolute bottom-6 left-6 right-6 z-[400]">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl flex items-start gap-3 max-w-2xl mx-auto">
                      <div className="bg-blue-50 text-[#004879] p-2 rounded-full shrink-0">
                          <Info size={18} />
                      </div>
                      <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Observation</p>
                          <p className="text-sm font-medium text-slate-800 leading-relaxed">
                              {getMapInsight()}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- CALENDAR VIEW --- */}
      {view === 'calendar' && (
         <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">{monthName}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-28 border-b border-r border-slate-50 bg-slate-50/30"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const { total, hasTx } = getDaySpending(day);
                    return (
                        <div 
                            key={`day-${day}`} 
                            onClick={() => handleDayClick(day)}
                            className="h-28 border-b border-r border-slate-50 p-2 relative group hover:bg-blue-50/50 transition-colors cursor-pointer"
                        >
                            <span className="text-sm font-bold text-slate-700">{day}</span>
                            {hasTx && total > 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
                                    -${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            )}
                            {hasTx && total === 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm">
                                    Income
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
         </div>
      )}

      {/* --- LIST VIEW --- */}
      {view === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            {selectedDate && (
                <div className="bg-[#004879] text-white p-4 flex justify-between items-center">
                    <span className="font-bold text-sm">Filtering by: {selectedDate}</span>
                    <button onClick={() => setSelectedDate(null)} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-2">
                        <X size={14} /> Clear Filter
                    </button>
                </div>
            )}
            
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 flex-1">
                <Filter size={16} className="text-slate-400 shrink-0" />
                {['All', 'Income', 'Shopping', 'Food & Drink', 'Transportation', 'Groceries'].map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setFilter(cat)} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-[#004879] text-white shadow-md' : 'bg-white border text-slate-500 hover:border-[#004879]'}`}
                >
                    {cat}
                </button>
                ))}
            </div>
            <div className="flex items-center gap-6 text-xs font-black text-slate-400 tracking-widest uppercase">
                <button onClick={() => handleSort('date')} className={`flex items-center gap-2 hover:text-[#004879] transition-colors ${sortField === 'date' ? 'text-[#004879]' : ''}`}>Date <ArrowUpDown size={14} /></button>
                <button onClick={() => handleSort('amount')} className={`flex items-center gap-2 hover:text-[#004879] transition-colors ${sortField === 'amount' ? 'text-[#004879]' : ''}`}>Amount <ArrowUpDown size={14} /></button>
            </div>
            </div>

            <div className="divide-y divide-slate-50">
            {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                <div key={t.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${t.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600 group-hover:bg-white'}`}>
                        {t.amount > 0 ? (t.id.startsWith('auto-income') ? <Repeat size={28} /> : <ArrowDownLeft size={28} />) : <ArrowUpRight size={28} />}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-[#004879] transition-colors">{t.description}</h4>
                        <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(t.date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs font-bold text-slate-500">{t.category}</span>
                        {t.economicBehavior && (
                            <>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{t.economicBehavior}</span>
                            </>
                        )}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className={`font-black text-xl tracking-tight ${t.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest mt-0.5">
                        {t.id.startsWith('auto-income') ? 'Auto-Deposit' : 'Manual Record'}
                        </p>
                    </div>
                    <button 
                        onClick={() => onDeleteTransaction(t.id)} 
                        className={`p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 ${t.id.startsWith('auto-income') ? 'hidden' : ''}`}
                    >
                        <Trash2 size={20} />
                    </button>
                    </div>
                </div>
                ))
            ) : (
                <div className="p-24 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <Wallet2 size={40} />
                </div>
                <p className="text-slate-900 font-bold text-lg">Your ledger is empty for this view.</p>
                <p className="text-slate-500 text-sm mt-1 max-w-xs">Start recording your income and spending manually to see your balance update live.</p>
                <button onClick={() => { setShowAddForm(true); setFilter('All'); setSelectedDate(null); }} className="mt-6 text-[#004879] font-black uppercase tracking-widest text-xs hover:underline">Add First Record</button>
                </div>
            )}
            </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
