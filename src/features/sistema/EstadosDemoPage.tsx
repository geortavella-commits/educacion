import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IngresoCodigo } from '@/features/alumno/IngresoCodigo';
import { Consentimiento } from '@/features/familia/Consentimiento';
import { DiagnosticoFlow } from '@/features/alumno/diagnostico/DiagnosticoFlow';
import { Inicio as AlumnoInicio } from '@/features/alumno/Inicio';
import { Tutor } from '@/features/alumno/Tutor';
import { Inicio as DocenteInicio } from '@/features/docente/Inicio';
import { Apoyo as DocenteApoyo } from '@/features/docente/Apoyo';
import { PerfilAlumno as DocentePerfilAlumno } from '@/features/docente/PerfilAlumno';
import { Proyecto as DocenteProyecto } from '@/features/docente/Proyecto';
import { Grupos as DocenteGrupos } from '@/features/docente/Grupos';
import { EstadoIngreso } from '@/services/ingreso';
import { EstadoConsentimiento } from '@/services/consentimiento';
import { Smartphone, Monitor, Palette, ArrowLeft } from 'lucide-react';

export const EstadosDemoPage: React.FC = () => {
  const [pantallaActiva, setPantallaActiva] = useState<
    | 'docente_inicio'
    | 'docente_apoyo'
    | 'docente_perfil'
    | 'docente_proyecto'
    | 'docente_grupos'
    | 'alumno_inicio'
    | 'alumno_tutor'
    | 'diagnostico'
    | 'ingreso'
    | 'consentimiento'
  >('docente_inicio');
  const [anchoSimulado, setAnchoSimulado] = useState<'movil' | 'auto'>('auto');

  // Estados forzados para testing de alumno / ingreso
  const [estadoIngresoForzado, setEstadoIngresoForzado] = useState<EstadoIngreso | undefined>(undefined);
  const [estadoConsentimientoForzado, setEstadoConsentimientoForzado] = useState<EstadoConsentimiento | undefined>(undefined);
  const [estadoAlumnoInicioForzado, setEstadoAlumnoInicioForzado] = useState<'feliz' | 'vacio' | 'error' | 'sin_permiso'>('feliz');
  const [estadoTutorForzado, setEstadoTutorForzado] = useState<'feliz' | 'sin_consentimiento' | 'error_audio' | 'cargando' | 'error'>('feliz');

  // Estados forzados para Docente
  const [estadoDocenteForzado, setEstadoDocenteForzado] = useState<'feliz' | 'cargando' | 'vacio' | 'error' | 'sin_permiso'>('feliz');

  return (
    <div className="min-h-screen w-full max-w-full bg-neutral-100 text-text p-4 md:p-8 space-y-6">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-divider pb-4 min-w-0">
        <div className="min-w-0">
          <div className="inline-block px-2.5 py-0.5 bg-accent-strong text-on-accent text-xs font-mono font-bold uppercase tracking-wider mb-1">
            Laboratorio de Estados (/sistema/estados)
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text break-words">
            Prueba de Componentes y Vistas
          </h1>
          <p className="text-xs md:text-sm text-text/70 mt-0.5 break-words">
            Validación de Panel Docente (1a, 4c, 3c, 3a, 3b) y Alumno en 360px, 390px, 768px y 1280px+.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/sistema"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-divider text-xs font-bold hover:bg-neutral-200"
          >
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tokens</span>
          </Link>
          <Link
            to="/ingresar"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-strong text-on-accent text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
          >
            <span>Ir a /ingresar</span>
          </Link>
          <Link
            to="/docente"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border-2 border-text text-xs font-bold hover:bg-text hover:text-on-accent"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Panel Docente</span>
          </Link>
        </div>
      </header>

      {/* Bloque Cuentas de prueba (solo desarrollo) */}
      <section className="max-w-7xl mx-auto bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/60 p-4 rounded-xl space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-2">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Solo desarrollo (import.meta.env.DEV)
            </span>
            <h2 className="text-base font-heading font-extrabold text-amber-950 dark:text-amber-100">
              Cuentas de prueba (clave: <code className="bg-amber-200/70 dark:bg-amber-900 px-1.5 py-0.5 rounded text-xs font-mono">educacion123</code>)
            </h2>
          </div>
          <span className="text-xs text-amber-800 dark:text-amber-300">
            Hacé clic en un botón para abrir /ingresar con la cuenta o probar casos especiales
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          <Link
            to="/ingresar?email=docente.laura@ficticio.test"
            className="p-3 bg-surface border border-divider hover:border-accent-strong rounded-lg flex flex-col justify-between gap-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">Seño Laura (Docente)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-mono">docente</span>
            </div>
            <span className="font-mono text-text/70 text-[11px] truncate">docente.laura@ficticio.test</span>
          </Link>

          <Link
            to="/ingresar?email=docente.julian@ficticio.test"
            className="p-3 bg-surface border border-divider hover:border-accent-strong rounded-lg flex flex-col justify-between gap-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">Seño Julián (Docente)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[11px] font-mono">docente</span>
            </div>
            <span className="font-mono text-text/70 text-[11px] truncate">docente.julian@ficticio.test</span>
          </Link>

          <Link
            to="/ingresar?email=directivo@ficticio.test"
            className="p-3 bg-surface border border-divider hover:border-accent-strong rounded-lg flex flex-col justify-between gap-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">Dirección (Directivo)</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[11px] font-mono">directivo</span>
            </div>
            <span className="font-mono text-text/70 text-[11px] truncate">directivo@ficticio.test</span>
          </Link>

          <Link
            to="/ingresar?email=familia.mateo@ficticio.test"
            className="p-3 bg-surface border border-divider hover:border-accent-strong rounded-lg flex flex-col justify-between gap-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">Familia de Mateo</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono">familia</span>
            </div>
            <span className="font-mono text-text/70 text-[11px] truncate">familia.mateo@ficticio.test</span>
          </Link>

          <Link
            to="/ingresar?email=alumno.mateo@ficticio.test"
            className="p-3 bg-surface border border-divider hover:border-accent-strong rounded-lg flex flex-col justify-between gap-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-text">Mateo (Alumno)</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[11px] font-mono">alumno</span>
            </div>
            <span className="font-mono text-text/70 text-[11px] truncate">alumno.mateo@ficticio.test</span>
          </Link>

          <div className="p-3 bg-surface border border-divider rounded-lg flex flex-col justify-between gap-1.5">
            <span className="font-bold text-red-700 dark:text-red-400">Casos especiales de prueba:</span>
            <div className="flex flex-wrap gap-1 text-[11px]">
              <Link to="/ingresar?email=bloqueado@ficticio.test" className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 rounded font-semibold hover:underline">
                Bloqueado 60s
              </Link>
              <Link to="/ingresar?email=sinred@ficticio.test" className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded font-semibold hover:underline">
                Sin red
              </Link>
              <Link to="/ingresar?motivo=vencida" className="px-2 py-0.5 bg-neutral-200 text-text rounded font-semibold hover:underline">
                ?vencida
              </Link>
              <Link to="/ingresar?motivo=sinpermiso" className="px-2 py-0.5 bg-neutral-200 text-text rounded font-semibold hover:underline">
                ?sinpermiso
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Selector de Pantallas */}
      <section className="max-w-7xl mx-auto bg-surface border-2 border-divider p-3 md:p-4 rounded-md space-y-3 min-w-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-heading font-extrabold uppercase text-accent-strong">
              Pantallas Docente (Tarea 5):
            </span>
            <div className="inline-flex bg-neutral-200 p-1 rounded-sm gap-1 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPantallaActiva('docente_inicio');
                  setEstadoDocenteForzado('feliz');
                }}
                className={`px-2.5 py-1 rounded-sm transition-colors ${pantallaActiva === 'docente_inicio' ? 'bg-accent-strong text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                1a Panel Inicio
              </button>
              <button
                type="button"
                onClick={() => {
                  setPantallaActiva('docente_apoyo');
                  setEstadoDocenteForzado('feliz');
                }}
                className={`px-2.5 py-1 rounded-sm transition-colors ${pantallaActiva === 'docente_apoyo' ? 'bg-accent-strong text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                4c Necesitan Apoyo
              </button>
              <button
                type="button"
                onClick={() => {
                  setPantallaActiva('docente_perfil');
                  setEstadoDocenteForzado('feliz');
                }}
                className={`px-2.5 py-1 rounded-sm transition-colors ${pantallaActiva === 'docente_perfil' ? 'bg-accent-strong text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                3c Perfil Alumno
              </button>
              <button
                type="button"
                onClick={() => {
                  setPantallaActiva('docente_proyecto');
                  setEstadoDocenteForzado('feliz');
                }}
                className={`px-2.5 py-1 rounded-sm transition-colors ${pantallaActiva === 'docente_proyecto' ? 'bg-accent-strong text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                3a Proyecto
              </button>
              <button
                type="button"
                onClick={() => {
                  setPantallaActiva('docente_grupos');
                  setEstadoDocenteForzado('feliz');
                }}
                className={`px-2.5 py-1 rounded-sm transition-colors ${pantallaActiva === 'docente_grupos' ? 'bg-accent-strong text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                3b Grupos Sugeridos
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-divider">
            <span className="text-xs font-heading font-extrabold uppercase text-text/70">
              Otras Pantallas:
            </span>
            <div className="inline-flex bg-neutral-200 p-1 rounded-sm gap-1 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setPantallaActiva('alumno_inicio')}
                className={`px-2 py-1 rounded-sm ${pantallaActiva === 'alumno_inicio' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                2a Inicio Alumno
              </button>
              <button
                type="button"
                onClick={() => setPantallaActiva('alumno_tutor')}
                className={`px-2 py-1 rounded-sm ${pantallaActiva === 'alumno_tutor' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                2b Tutor Alumno
              </button>
              <button
                type="button"
                onClick={() => setPantallaActiva('diagnostico')}
                className={`px-2 py-1 rounded-sm ${pantallaActiva === 'diagnostico' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                6 Diagnóstico
              </button>
              <button
                type="button"
                onClick={() => setPantallaActiva('ingreso')}
                className={`px-2 py-1 rounded-sm ${pantallaActiva === 'ingreso' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                3d Ingreso
              </button>
              <button
                type="button"
                onClick={() => setPantallaActiva('consentimiento')}
                className={`px-2 py-1 rounded-sm ${pantallaActiva === 'consentimiento' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
              >
                3e Consentimiento
              </button>
            </div>
          </div>
        </div>

        {/* Selector de Ancho */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-divider">
          <span className="text-xs font-heading font-extrabold uppercase text-text/70">
            Simulador de Ancho:
          </span>
          <div className="inline-flex bg-neutral-200 p-1 rounded-sm gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAnchoSimulado('movil')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm transition-colors ${anchoSimulado === 'movil' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
            >
              <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>390px (Móvil)</span>
            </button>
            <button
              type="button"
              onClick={() => setAnchoSimulado('auto')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm transition-colors ${anchoSimulado === 'auto' ? 'bg-text text-on-accent' : 'text-text/70 hover:text-text'}`}
            >
              <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ancho Completo (Desktop/Fluido)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Selector de Estados para pantallas Docente */}
      {pantallaActiva.startsWith('docente_') && (
        <section className="max-w-7xl mx-auto bg-surface border border-divider p-3 rounded-md space-y-2 text-xs min-w-0">
          <span className="font-heading font-extrabold text-accent-strong uppercase block">
            Forzar Estado de la Pantalla Docente Actual:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(['feliz', 'cargando', 'vacio', 'error', 'sin_permiso'] as const).map((est) => (
              <button
                key={est}
                onClick={() => setEstadoDocenteForzado(est)}
                className={`px-3 py-1.5 border rounded-sm font-heading font-bold capitalize ${
                  estadoDocenteForzado === est
                    ? 'bg-accent-strong text-on-accent border-accent-strong'
                    : 'bg-bg text-text hover:bg-neutral-200'
                }`}
              >
                {est === 'feliz' ? 'Normal (Feliz)' : est.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Controles para Alumno */}
      {pantallaActiva === 'alumno_inicio' && (
        <section className="max-w-7xl mx-auto bg-surface border border-divider p-3 rounded-md space-y-2 text-xs min-w-0">
          <span className="font-heading font-extrabold text-accent-strong uppercase block">
            Forzar Estado · Inicio Alumno:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(['feliz', 'vacio', 'error', 'sin_permiso'] as const).map((est) => (
              <button
                key={est}
                onClick={() => setEstadoAlumnoInicioForzado(est)}
                className={`px-2.5 py-1 border rounded-sm capitalize ${estadoAlumnoInicioForzado === est ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
              >
                {est === 'feliz' ? 'Activo (Feliz)' : est}
              </button>
            ))}
          </div>
        </section>
      )}

      {pantallaActiva === 'alumno_tutor' && (
        <section className="max-w-7xl mx-auto bg-surface border border-divider p-3 rounded-md space-y-2 text-xs min-w-0">
          <span className="font-heading font-extrabold text-accent-strong uppercase block">
            Forzar Estado · Tutor Alumno:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(['feliz', 'sin_consentimiento', 'error_audio', 'cargando', 'error'] as const).map((est) => (
              <button
                key={est}
                onClick={() => setEstadoTutorForzado(est)}
                className={`px-2.5 py-1 border rounded-sm capitalize ${estadoTutorForzado === est ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
              >
                {est === 'feliz' ? 'Normal / Conversación' : est.replace('_', ' ')}
              </button>
            ))}
          </div>
        </section>
      )}

      {pantallaActiva === 'ingreso' && (
        <section className="max-w-7xl mx-auto bg-surface border border-divider p-3 rounded-md space-y-2 text-xs min-w-0">
          <span className="font-heading font-extrabold text-accent-strong uppercase block">
            Forzar Estado · Ingreso Alumno:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setEstadoIngresoForzado(undefined)}
              className={`px-2 py-1 border ${estadoIngresoForzado === undefined ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Interactivo
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('cargando')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'cargando' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Cargando
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('vencido')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'vencido' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Código vencido
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('incorrecto')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'incorrecto' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Código incorrecto
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('demasiados_intentos')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'demasiados_intentos' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Demasiados intentos
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('esperando_aprobacion')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'esperando_aprobacion' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Esperando aprobación
            </button>
            <button
              onClick={() => setEstadoIngresoForzado('error_red')}
              className={`px-2 py-1 border ${estadoIngresoForzado === 'error_red' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Error de red
            </button>
          </div>
        </section>
      )}

      {pantallaActiva === 'consentimiento' && (
        <section className="max-w-7xl mx-auto bg-surface border border-divider p-3 rounded-md space-y-2 text-xs min-w-0">
          <span className="font-heading font-extrabold text-accent-strong uppercase block">
            Forzar Estado · Consentimiento Familiar:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setEstadoConsentimientoForzado('pendiente')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'pendiente' || !estadoConsentimientoForzado ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Pendiente (Formulario)
            </button>
            <button
              onClick={() => setEstadoConsentimientoForzado('otorgado')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'otorgado' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Ya otorgado
            </button>
            <button
              onClick={() => setEstadoConsentimientoForzado('revocado')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'revocado' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Revocado
            </button>
            <button
              onClick={() => setEstadoConsentimientoForzado('sin_permiso')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'sin_permiso' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Sin permiso
            </button>
            <button
              onClick={() => setEstadoConsentimientoForzado('cargando')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'cargando' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Cargando
            </button>
            <button
              onClick={() => setEstadoConsentimientoForzado('error_red')}
              className={`px-2 py-1 border ${estadoConsentimientoForzado === 'error_red' ? 'bg-accent-strong text-on-accent font-bold' : 'bg-bg text-text'}`}
            >
              Error de red
            </button>
          </div>
        </section>
      )}

      {/* Lienzo Principal */}
      <main className="max-w-7xl mx-auto min-w-0">
        <div
          className={`mx-auto transition-all duration-300 min-w-0 ${
            anchoSimulado === 'movil' ? 'max-w-[390px] border-x-2 border-divider p-2 bg-bg shadow-md rounded-xl' : 'w-full'
          }`}
        >
          {pantallaActiva === 'docente_inicio' && (
            <DocenteInicio
              key={`doc-ini-${estadoDocenteForzado}`}
              forcedEstado={estadoDocenteForzado}
            />
          )}

          {pantallaActiva === 'docente_apoyo' && (
            <DocenteApoyo
              key={`doc-apoyo-${estadoDocenteForzado}`}
              forcedEstado={estadoDocenteForzado}
            />
          )}

          {pantallaActiva === 'docente_perfil' && (
            <DocentePerfilAlumno
              key={`doc-perfil-${estadoDocenteForzado}`}
              forcedEstado={estadoDocenteForzado}
            />
          )}

          {pantallaActiva === 'docente_proyecto' && (
            <DocenteProyecto
              key={`doc-proy-${estadoDocenteForzado}`}
              forcedEstado={estadoDocenteForzado}
            />
          )}

          {pantallaActiva === 'docente_grupos' && (
            <DocenteGrupos
              key={`doc-grupos-${estadoDocenteForzado}`}
              forcedEstado={estadoDocenteForzado}
            />
          )}

          {pantallaActiva === 'alumno_inicio' && (
            <AlumnoInicio
              key={`inicio-${estadoAlumnoInicioForzado}`}
              forcedEstado={estadoAlumnoInicioForzado}
            />
          )}

          {pantallaActiva === 'alumno_tutor' && (
            <Tutor
              key={`tutor-${estadoTutorForzado}`}
              forcedEstado={estadoTutorForzado}
            />
          )}

          {pantallaActiva === 'diagnostico' && <DiagnosticoFlow />}

          {pantallaActiva === 'ingreso' && (
            <IngresoCodigo
              key={`ingreso-${estadoIngresoForzado}`}
              forcedEstado={estadoIngresoForzado}
            />
          )}

          {pantallaActiva === 'consentimiento' && (
            <Consentimiento
              key={`cons-${estadoConsentimientoForzado}`}
              forcedEstado={estadoConsentimientoForzado}
            />
          )}
        </div>
      </main>
    </div>
  );
};
