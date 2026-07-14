"use client";

import { useEffect, useMemo, useState } from "react";

type Billing = "usuario" | "fijo" | "uso";
type Tool = {
  id: number;
  name: string;
  billing: Billing;
  price: number;
  users: number;
  units: number;
  category: string;
};

const initialTools: Tool[] = [
  { id: 1, name: "Asistente de texto", billing: "usuario", price: 20, users: 3, units: 1, category: "Productividad" },
  { id: 2, name: "Generador de imágenes", billing: "fijo", price: 24, users: 1, units: 1, category: "Creatividad" },
  { id: 3, name: "API / automatizaciones", billing: "uso", price: 0.015, users: 1, units: 1200, category: "Automatización" },
];

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("es", { style: "currency", currency, maximumFractionDigits: 2 }).format(value || 0);

export default function Home() {
  const [tools, setTools] = useState<Tool[]>(initialTools);
  const [currency, setCurrency] = useState("USD");
  const [budget, setBudget] = useState(150);
  const [revenue, setRevenue] = useState(2400);
  const [hoursSaved, setHoursSaved] = useState(32);
  const [hourValue, setHourValue] = useState(8);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("costeia-scenario");
    const timer = window.setTimeout(() => {
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setTools(data.tools ?? initialTools);
          setCurrency(data.currency ?? "USD");
          setBudget(data.budget ?? 150);
          setRevenue(data.revenue ?? 2400);
          setHoursSaved(data.hoursSaved ?? 32);
          setHourValue(data.hourValue ?? 8);
        } catch { /* conservar valores iniciales */ }
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("costeia-scenario", JSON.stringify({ tools, currency, budget, revenue, hoursSaved, hourValue }));
  }, [tools, currency, budget, revenue, hoursSaved, hourValue, loaded]);

  const totals = useMemo(() => {
    const monthly = tools.reduce((sum, tool) => {
      if (tool.billing === "usuario") return sum + tool.price * tool.users;
      if (tool.billing === "uso") return sum + tool.price * tool.units;
      return sum + tool.price;
    }, 0);
    const valueCreated = hoursSaved * hourValue;
    return {
      monthly,
      annual: monthly * 12,
      perEmployee: monthly / Math.max(1, tools.reduce((max, t) => Math.max(max, t.users), 1)),
      budgetUse: budget > 0 ? (monthly / budget) * 100 : 0,
      revenueUse: revenue > 0 ? (monthly / revenue) * 100 : 0,
      valueCreated,
      netValue: valueCreated - monthly,
      roi: monthly > 0 ? ((valueCreated - monthly) / monthly) * 100 : 0,
    };
  }, [tools, budget, revenue, hoursSaved, hourValue]);

  const updateTool = (id: number, field: keyof Tool, value: string | number) => {
    setTools(items => items.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTool = () => setTools(items => [...items, {
    id: Date.now(), name: "Nueva herramienta", billing: "usuario", price: 10, users: 1, units: 1, category: "Otro"
  }]);

  const reset = () => {
    setTools(initialTools); setCurrency("USD"); setBudget(150); setRevenue(2400); setHoursSaved(32); setHourValue(8);
    localStorage.removeItem("costeia-scenario");
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="CosteIA, inicio"><span className="brandmark">C</span> Coste<span>IA</span></a>
        <nav aria-label="Navegación principal">
          <a href="#calculadora">Calculadora</a><a href="#rentabilidad">Rentabilidad</a><a href="#metodo">Cómo funciona</a>
        </nav>
        <button className="ghost" onClick={reset}>Restablecer</button>
      </header>

      <section className="hero" id="inicio">
        <div className="eyebrow"><i /> Control de gasto para equipos pequeños</div>
        <h1>Descubre cuánto te cuesta realmente la <em>inteligencia artificial.</em></h1>
        <p>Reúne suscripciones y consumo por API en un solo lugar. Calcula tu gasto mensual, presupuesto anual y retorno estimado sin crear una cuenta.</p>
        <a className="primary" href="#calculadora">Calcular mis costos <span>↓</span></a>
        <div className="trust"><span>✓ Gratis</span><span>✓ Datos en tu dispositivo</span><span>✓ Precios editables</span></div>
      </section>

      <section className="workspace" id="calculadora">
        <div className="workspace-head">
          <div><span className="step">01</span><h2>Construye tu gasto mensual</h2><p>Agrega cada herramienta y ajusta su forma de cobro.</p></div>
          <label className="currency">Moneda<select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>EUR</option><option>NIO</option><option>MXN</option><option>COP</option></select></label>
        </div>

        <div className="calculator-grid">
          <div className="tool-list">
            {tools.map((tool, index) => {
              const subtotal = tool.billing === "usuario" ? tool.price * tool.users : tool.billing === "uso" ? tool.price * tool.units : tool.price;
              return <article className="tool-card" key={tool.id}>
                <div className="tool-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="tool-fields">
                  <div className="field wide"><label>Herramienta</label><input value={tool.name} onChange={e => updateTool(tool.id, "name", e.target.value)} /></div>
                  <div className="field"><label>Tipo de cobro</label><select value={tool.billing} onChange={e => updateTool(tool.id, "billing", e.target.value)}><option value="usuario">Por usuario</option><option value="fijo">Plan fijo</option><option value="uso">Por unidad / API</option></select></div>
                  <div className="field"><label>{tool.billing === "uso" ? "Costo por unidad" : "Precio mensual"}</label><div className="money-input"><span>{currency}</span><input type="number" min="0" step="0.001" value={tool.price} onChange={e => updateTool(tool.id, "price", +e.target.value)} /></div></div>
                  {tool.billing === "usuario" && <div className="field small"><label>Usuarios</label><input type="number" min="1" value={tool.users} onChange={e => updateTool(tool.id, "users", +e.target.value)} /></div>}
                  {tool.billing === "uso" && <div className="field small"><label>Unidades / mes</label><input type="number" min="0" value={tool.units} onChange={e => updateTool(tool.id, "units", +e.target.value)} /></div>}
                </div>
                <div className="subtotal"><span>Subtotal</span><strong>{money(subtotal, currency)}</strong><button onClick={() => setTools(items => items.filter(t => t.id !== tool.id))} aria-label={`Eliminar ${tool.name}`}>×</button></div>
              </article>;
            })}
            <button className="add" onClick={addTool}><span>＋</span> Agregar otra herramienta</button>
          </div>

          <aside className="summary">
            <div className="summary-label">Tu inversión estimada</div>
            <div className="big-total"><strong>{money(totals.monthly, currency)}</strong><span>/ mes</span></div>
            <div className="annual">{money(totals.annual, currency)} al año</div>
            <div className="divider" />
            <div className="metric"><span>Costo por empleado</span><strong>{money(totals.perEmployee, currency)}</strong></div>
            <div className="metric"><span>Herramientas activas</span><strong>{tools.length}</strong></div>
            <div className="budget-field"><label>Presupuesto mensual</label><div className="money-input dark"><span>{currency}</span><input type="number" min="0" value={budget} onChange={e => setBudget(+e.target.value)} /></div></div>
            <div className="progress"><div style={{ width: `${Math.min(totals.budgetUse, 100)}%` }} /></div>
            <p className={totals.budgetUse > 100 ? "danger" : "ok"}>{totals.budgetUse > 100 ? `Excedes el presupuesto por ${money(totals.monthly-budget, currency)}` : `${Math.round(totals.budgetUse)}% del presupuesto utilizado`}</p>
            <button className="print" onClick={() => window.print()}>Exportar resumen en PDF</button>
          </aside>
        </div>
      </section>

      <section className="roi-section" id="rentabilidad">
        <div className="roi-intro"><span className="step">02</span><h2>¿La inversión se está pagando sola?</h2><p>Estima el valor del tiempo recuperado. Es una referencia para decidir qué herramientas conservar, no una garantía financiera.</p></div>
        <div className="roi-panel">
          <div className="roi-inputs">
            <label>Ingresos mensuales del negocio<input type="number" min="0" value={revenue} onChange={e => setRevenue(+e.target.value)} /></label>
            <label>Horas ahorradas al mes<input type="number" min="0" value={hoursSaved} onChange={e => setHoursSaved(+e.target.value)} /></label>
            <label>Valor de una hora<input type="number" min="0" value={hourValue} onChange={e => setHourValue(+e.target.value)} /></label>
          </div>
          <div className="roi-results">
            <div><span>IA / ingresos</span><strong>{totals.revenueUse.toFixed(1)}%</strong></div>
            <div><span>Valor recuperado</span><strong>{money(totals.valueCreated, currency)}</strong></div>
            <div className={totals.netValue >= 0 ? "positive" : "negative"}><span>Valor neto mensual</span><strong>{money(totals.netValue, currency)}</strong><small>ROI estimado: {Math.round(totals.roi)}%</small></div>
          </div>
        </div>
      </section>

      <section className="method" id="metodo">
        <div><span className="method-no">01</span><h3>Agrega</h3><p>Introduce suscripciones, usuarios y consumo de API.</p></div>
        <div><span className="method-no">02</span><h3>Compara</h3><p>Contrasta el gasto con tu presupuesto e ingresos.</p></div>
        <div><span className="method-no">03</span><h3>Decide</h3><p>Identifica duplicados y herramientas que no generan valor.</p></div>
      </section>

      <footer><div className="brand light"><span className="brandmark">C</span> Coste<span>IA</span></div><p>Calculadora educativa. Los precios y resultados son introducidos por el usuario y pueden variar.</p><span>Actualizado: julio de 2026</span></footer>
    </main>
  );
}
