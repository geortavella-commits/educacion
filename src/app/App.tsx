import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './HomePage';
import { Ingreso, Recuperar } from '@/features/auth';
import { RutaProtegida, RutaDevOnly } from '@/components/RutaProtegida';
import { DocenteLayout } from '@/features/docente/DocenteLayout';
import { Inicio as DocenteInicio } from '@/features/docente/Inicio';
import { Apoyo } from '@/features/docente/Apoyo';
import { PerfilAlumno } from '@/features/docente/PerfilAlumno';
import { Proyecto } from '@/features/docente/Proyecto';
import { Alumnos } from '@/features/docente/Alumnos';
import { GrupoDetalle } from '@/features/docente/GrupoDetalle';
import { ProyectosList } from '@/features/docente/ProyectosList';
import { AlumnoLayout } from '@/features/alumno/AlumnoLayout';
import { Inicio } from '@/features/alumno/Inicio';
import { DiagnosticoFlow } from '@/features/alumno/diagnostico/DiagnosticoFlow';
import { MisionPage } from '@/features/alumno/mision/MisionPage';
import { IngresoCodigo } from '@/features/alumno/IngresoCodigo';
import { AccesoAlumno } from '@/features/alumno/AccesoAlumno';
import { FamiliaLayout } from '@/features/familia/FamiliaLayout';
import { FamiliaPage } from '@/features/familia/FamiliaPage';
import { DirectivoLayout } from '@/features/directivo/DirectivoLayout';
import { DirectivoPage } from '@/features/directivo/DirectivoPage';
import { PedidosIngreso } from '@/features/docente/PedidosIngreso';
import { ConsentimientosDocente } from '@/features/docente/ConsentimientosDocente';
import { NuevoGrupo } from '@/features/docente/NuevoGrupo';
import { NuevoProyecto } from '@/features/docente/NuevoProyecto';
import { ConsentimientoPage } from '@/features/familia/ConsentimientoPage';
import { InvitacionFamilia } from '@/features/familia/InvitacionFamilia';
import { ImprimirHojas } from '@/features/imprimir/ImprimirHojas';
import { Restablecer } from '@/features/auth/Restablecer';

// Páginas de laboratorio: solo existen en desarrollo. El import dinámico dentro de `import.meta.env.DEV`
// hace que Vite las saque del paquete de producción (así no viajan cuentas ni contraseñas de prueba).
const SistemaTokensPage = import.meta.env.DEV
  ? lazy(() => import('@/features/sistema/SistemaTokensPage').then((m) => ({ default: m.SistemaTokensPage })))
  : () => null;
const EstadosDemoPage = import.meta.env.DEV
  ? lazy(() => import('@/features/sistema/EstadosDemoPage').then((m) => ({ default: m.EstadosDemoPage })))
  : () => null;

// Los grupos de un proyecto ahora se ven y se arman dentro del propio proyecto.
const GruposDelProyecto: React.FC = () => {
  const { id } = useParams();
  return <Navigate to={id && id !== 'actual' ? `/docente/proyectos/${id}` : '/docente/proyectos'} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Autenticación */}
        <Route path="/ingresar" element={<Ingreso />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/restablecer" element={<Restablecer />} />
        <Route path="/familia/invitacion" element={<InvitacionFamilia />} />

        {/* Hojas imprimibles (sin menú: salen limpias al papel o al PDF) */}
        <Route path="/docente/proyectos/:id/imprimir" element={<RutaProtegida roles={['docente']}><ImprimirHojas origen="docente" /></RutaProtegida>} />
        <Route path="/familia/imprimir" element={<RutaProtegida roles={['familia']}><ImprimirHojas origen="familia" /></RutaProtegida>} />

        {/* Docente (Protegido para rol docente) */}
        <Route
          path="/docente"
          element={
            <RutaProtegida roles={['docente']}>
              <DocenteLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<DocenteInicio />} />
          <Route path="apoyo" element={<Apoyo />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="alumnos/:id" element={<PerfilAlumno />} />
          <Route path="proyectos" element={<ProyectosList />} />
          <Route path="proyectos/:id" element={<Proyecto />} />
          <Route path="proyectos/:id/grupos" element={<GruposDelProyecto />} />
          <Route path="grupos" element={<Navigate to="/docente/proyectos" replace />} />
          <Route path="grupos/nuevo" element={<NuevoGrupo />} />
          <Route path="grupos/:id" element={<GrupoDetalle />} />
          <Route path="proyectos/nuevo" element={<NuevoProyecto />} />
          <Route path="ingresos" element={<PedidosIngreso />} />
          <Route path="consentimientos" element={<ConsentimientosDocente />} />
        </Route>

        {/* Alumno: ingreso por código es público, el resto requiere rol alumno */}
        <Route path="/alumno" element={<AlumnoLayout />}>
          <Route path="ingreso" element={<IngresoCodigo />} />
          <Route path="acceso" element={<AccesoAlumno />} />
          <Route element={<RutaProtegida roles={['alumno']} />}>
            <Route index element={<Inicio />} />
            <Route path="diagnostico" element={<DiagnosticoFlow />} />
            <Route path="tutor" element={<Navigate to="/alumno" replace />} />
            <Route path="mision/:id" element={<MisionPage />} />
          </Route>
        </Route>

        {/* Familia (Protegido para rol familia) */}
        <Route
          path="/familia"
          element={
            <RutaProtegida roles={['familia']}>
              <FamiliaLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<FamiliaPage />} />
          <Route path="consentimiento" element={<ConsentimientoPage />} />
        </Route>

        {/* Directivo (Protegido para rol directivo) */}
        <Route
          path="/directivo"
          element={
            <RutaProtegida roles={['directivo']}>
              <DirectivoLayout />
            </RutaProtegida>
          }
        >
          <Route index element={<DirectivoPage />} />
        </Route>

        {/* Sistema de tokens y estados (solo desarrollo) */}
        <Route element={<RutaDevOnly />}>
          <Route path="/sistema" element={<Suspense fallback={null}><SistemaTokensPage /></Suspense>} />
          <Route path="/sistema/estados" element={<Suspense fallback={null}><EstadosDemoPage /></Suspense>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

