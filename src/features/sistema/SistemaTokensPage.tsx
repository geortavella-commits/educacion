import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ModoProvider,
  Button,
  Card,
  Tag,
  ProgressBar,
  Avatar,
  Input,
  Textarea,
  Radio,
  SegmentedControl,
  Table,
  Dialog,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  ChatBubble,
  SelloSinSpoilers,
  HipotesisItem,
  NavLateral,
  BarraInferior,
} from '@/components';
import {
  Settings,
  Home,
  Users,
  Folder,
  FlaskConical,
  BookOpen,
  Compass,
  Star,
  MessageSquare,
  Rocket,
  ArrowLeft,
  TestTube,
} from 'lucide-react';

interface ComponentesShowcaseProps {
  modo: 'secundaria' | 'primaria';
  titulo: string;
  subtitulo: string;
}

const ComponentesShowcase: React.FC<ComponentesShowcaseProps> = ({
  modo,
  titulo,
  subtitulo,
}) => {
  const [radioVal, setRadioVal] = useState('1');
  const [segVal, setSegVal] = useState('ciencias');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Tabla con estados descriptivos pedagógicos (NO valorativos/clasificatorios)
  const demoTableData = [
    { id: '1', nombre: 'Mateo', misiones: '4 de 5', estado: 'Está avanzando' },
    { id: '2', nombre: 'Sofía', misiones: '5 de 5', estado: 'Completó las misiones del día' },
    { id: '3', nombre: 'Lucas', misiones: '2 de 5', estado: 'Iniciando actividad' },
  ];

  return (
    <ModoProvider nivel={modo}>
      <div className="bg-bg text-text p-4 md:p-6 border-2 border-divider flex flex-col gap-6 md:gap-8 transition-all w-full max-w-full min-w-0 overflow-hidden">
        {/* Cabecera del Modo */}
        <div className="border-b-2 border-divider pb-4 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span className="text-xs uppercase font-extrabold tracking-wider text-accent-strong">
              {modo === 'primaria'
                ? 'Modo Primaria (Estilo Suave)'
                : 'Modo Base (Modernist)'}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 bg-surface border border-divider">
              data-modo="{modo}"
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-heading font-extrabold break-words">{titulo}</h2>
          <p className="text-xs md:text-sm text-text/70 break-words">{subtitulo}</p>
        </div>

        {/* 1. Botones */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            1. Botones (Button)
          </h3>
          <div className="flex flex-wrap gap-2.5 items-center">
            <Button variant="primary">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="icon" aria-label="Ajustes de prueba">
              <Settings className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button variant="primary" disabled>
              Deshabilitado
            </Button>
            <Button variant="primary" isLoading>
              Cargando
            </Button>
          </div>
        </section>

        {/* 2. Tarjetas (Card) */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            2. Tarjetas (Card)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
            <Card
              kicker="Matemática y Medida"
              title="¿Cuánto mide la cancha?"
              meta="NAP Geometría"
              elevation="sm"
            >
              Calculamos el perímetro usando pasos antes de aplicar la fórmula.
            </Card>
            <Card
              kicker="Interdisciplinario"
              title="Proyecto Cancha de Barrio"
              meta="5º B"
              interactive
              elevation="md"
            >
              Integración de Ciencias Naturales, Lengua y Geometría.
            </Card>
          </div>
        </section>

        {/* 3. Tags / Chips */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            3. Tags & Chips
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Tag variant="accent">Tag Accent</Tag>
            <Tag variant="accent-2">Tag Accent 2</Tag>
            <Tag variant="neutral">Tag Neutral</Tag>
            <Tag variant="outline">Tag Outline</Tag>
            <Tag variant="accent" interactive>
              <Star className="w-3 h-3 text-accent-strong mr-1" aria-hidden="true" />
              Interactivo
            </Tag>
          </div>
        </section>

        {/* 4. Avance de Misiones (ProgressBar) */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            4. Avance de misiones (ProgressBar)
          </h3>
          <ProgressBar
            value={72}
            label="Avance de misiones"
            sublabel="Proyecto La Cancha del Barrio · 5º Grado"
          />
        </section>

        {/* 5. Avatares */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            5. Avatares (Sin fotos de personas)
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <Avatar nombre="Mateo" size="sm" variant="accent" />
            <Avatar nombre="Sofía" size="md" variant="accent-2" />
            <Avatar nombre="Prof. Mariana" size="lg" variant="neutral" />
            <Avatar iniciales="CH" size="xl" variant="accent" />
          </div>
        </section>

        {/* 6. Formularios */}
        <section className="space-y-4 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            6. Formularios y Entradas
          </h3>
          <div className="space-y-3 min-w-0">
            <Input
              id={`nombre-alumno-${modo}`}
              label="Nombre visible del alumno"
              placeholder="Ej: Mateo"
              hint="Solo tu nombre de pila, sin apellido ni mail."
            />
            <Input
              id={`codigo-clase-${modo}`}
              label="Código de clase (con error)"
              defaultValue="ABC"
              error="El código debe tener 6 letras o números."
            />
            <Textarea
              id={`pregunta-chasqui-${modo}`}
              label="Pregunta para el tutor Chasqui"
              placeholder="¿Cómo calculo el área si la figura es irregular?"
              rows={2}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Radio
                id={`radio-regla-${modo}`}
                name={`r-${modo}`}
                label="Opción 1: Medir con regla"
                description="Usamos instrumentos de precisión."
                checked={radioVal === '1'}
                onChange={() => setRadioVal('1')}
              />
              <Radio
                id={`radio-pasos-${modo}`}
                name={`r-${modo}`}
                label="Opción 2: Medir con pasos"
                description="Estimación previa en el patio."
                checked={radioVal === '2'}
                onChange={() => setRadioVal('2')}
              />
            </div>

            <div className="pt-2 min-w-0">
              <label
                htmlFor={`seg-${modo}-ciencias`}
                className="block text-xs font-heading font-bold text-text/70 mb-1.5"
              >
                Segmented Control
              </label>
              <SegmentedControl
                name={`seg-${modo}`}
                value={segVal}
                onChange={setSegVal}
                options={[
                  {
                    value: 'ciencias',
                    label: 'Ciencias',
                    icon: <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />,
                  },
                  {
                    value: 'lengua',
                    label: 'Lengua',
                    icon: <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />,
                  },
                  {
                    value: 'mate',
                    label: 'Matemática',
                    icon: <Compass className="w-3.5 h-3.5" aria-hidden="true" />,
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* 7. Tabla Simple con Estados Pedagógicos No Clasificatorios */}
        <section className="space-y-3 min-w-0 w-full overflow-hidden">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            7. Tabla Simple (Avance de misiones descriptivo)
          </h3>
          <div className="w-full max-w-full overflow-x-auto min-w-0">
            <Table
              data={demoTableData}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  key: 'nombre',
                  header: 'Alumno (Primaria)',
                  render: (item) => (
                    <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                      <Avatar nombre={item.nombre} size="sm" variant="accent-2" />
                      <span>{item.nombre}</span>
                    </div>
                  ),
                },
                { key: 'misiones', header: 'Misiones', align: 'center', className: 'whitespace-nowrap' },
                {
                  key: 'estado',
                  header: 'Actividad reciente',
                  align: 'right',
                  className: 'whitespace-nowrap',
                  render: (item) => (
                    <Tag variant="neutral">
                      {item.estado}
                    </Tag>
                  ),
                },
              ]}
            />
          </div>
        </section>

        {/* 8. Diálogo / Modal con Focus Trap */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            8. Diálogo / Modal Accesible (Focus Trap y ESC)
          </h3>
          <div>
            <Button variant="secondary" onClick={() => setIsDialogOpen(true)}>
              Abrir Modal de Prueba
            </Button>
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              title="Nueva propuesta de actividad"
              description="Ajuste pedagógico para el grupo de ciencias"
              actions={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Confirmar
                  </Button>
                </>
              }
            >
              <p>
                Esta actividad integrará preguntas orientadas al método socrático
                para guiar sin dar respuestas servidas.
              </p>
            </Dialog>
          </div>
        </section>

        {/* 9. Estados de Pantalla */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            9. Estados (Vacío, Error, Carga)
          </h3>
          <div className="space-y-3 min-w-0">
            <EmptyState
              title="Sin proyectos iniciados"
              description="Creá tu primer proyecto interdisciplinario alineado al diseño curricular de Córdoba."
              actionText="+ Crear Proyecto"
              onAction={() => alert('Crear proyecto')}
            />
            <ErrorState
              title="Error al sincronizar datos"
              message="No pudimos cargar la lista de grupos. Por favor, reintentá."
              onRetry={() => alert('Reintentando...')}
            />
            <div className="space-y-1 min-w-0">
              <span className="text-xs text-text/60 block font-mono">
                LoadingSkeleton:
              </span>
              <LoadingSkeleton type="row" count={2} />
            </div>
          </div>
        </section>

        {/* 10. ChatBubble */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            10. Burbujas de Chat (Chasqui Tutor vs Alumno)
          </h3>
          <div className="p-3 md:p-4 bg-neutral-200/50 rounded-lg border border-divider space-y-2 min-w-0">
            <ChatBubble
              emisor="alumno"
              nombre="Mateo"
              contenido="¿El área de la cancha de fútbol es lo mismo que el perímetro?"
              hora="10:14"
            />
            <ChatBubble
              emisor="tutor"
              contenido="¡Buena pregunta, Mateo! Pensalo así: si tuvieras que poner un alambrado alrededor de la cancha, ¿qué estarías midiendo? ¿Y si tuvieras que sembrar todo el pasto adentro?"
              hora="10:15"
            />
          </div>
        </section>

        {/* 11. Sello Sin Spoilers */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            11. Sello Sin Spoilers
          </h3>
          <div className="flex flex-col gap-2.5 min-w-0">
            <SelloSinSpoilers variant="badge" />
            <SelloSinSpoilers variant="card" />
            <SelloSinSpoilers variant="banner" />
          </div>
        </section>

        {/* 12. HipotesisItem */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            12. Hipótesis Pedagógica (Regla Ética 8)
          </h3>
          <HipotesisItem
            alumnoNombre="Mateo"
            observacionHipotesis="Confunde perímetro con área al calcular el contorno de figuras compuestas."
            sugerencia="Proponerle medir con pasos el contorno del patio antes de aplicar la fórmula en el cuaderno."
          />
        </section>

        {/* 13. NavLateral y BarraInferior */}
        <section className="space-y-3 min-w-0">
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-text/70">
            13. Navegación (NavLateral & BarraInferior)
          </h3>
          <div className="border border-divider rounded-md overflow-hidden bg-surface">
            <div className="h-64 flex">
              <NavLateral
                titulo="Chasqui Docente"
                usuarioNombre="Prof. Mariana Ríos"
                escuela="Esc. N° 14, Córdoba"
                items={[
                  {
                    to: '#inicio',
                    label: 'Inicio',
                    icon: <Home className="w-4 h-4" aria-hidden="true" />,
                  },
                  {
                    to: '#grupos',
                    label: 'Grupos',
                    icon: <Users className="w-4 h-4" aria-hidden="true" />,
                    badge: '4',
                  },
                  {
                    to: '#proyectos',
                    label: 'Proyectos',
                    icon: <Folder className="w-4 h-4" aria-hidden="true" />,
                  },
                ]}
                className="w-full h-full min-h-0 border-r-0"
              />
            </div>
          </div>
          <div className="p-3 bg-surface border border-divider rounded-md min-w-0">
            <span className="text-xs font-mono text-text/60 block mb-2">
              Barra Inferior Móvil:
            </span>
            <div className="relative border border-divider rounded-md overflow-hidden bg-surface">
              <BarraInferior
                className="relative z-0 border-t-0 shadow-none md:flex"
                items={[
                  {
                    to: '#misiones',
                    label: 'Misiones',
                    icon: <Rocket className="w-4 h-4 text-accent-strong" aria-hidden="true" />,
                  },
                  {
                    to: '#chasqui',
                    label: 'Chasqui',
                    icon: <MessageSquare className="w-4 h-4" aria-hidden="true" />,
                  },
                  {
                    to: '#logros',
                    label: 'Logros',
                    icon: <Star className="w-4 h-4" aria-hidden="true" />,
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </ModoProvider>
  );
};

export const SistemaTokensPage: React.FC = () => {
  return (
    <div className="min-h-screen w-full max-w-full bg-neutral-100 text-text p-4 md:p-8 space-y-6 md:space-y-8">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-divider pb-4 min-w-0">
        <div className="min-w-0">
          <div className="inline-block px-2.5 py-0.5 bg-accent-strong text-on-accent text-xs font-mono font-bold uppercase tracking-wider mb-1">
            Galería del Sistema y Componentes
          </div>
          <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-text break-words">
            Componentes Compartidos & Modos
          </h1>
          <p className="text-text/70 text-xs md:text-sm mt-1 break-words">
            Demostración lado a lado en <strong>Modo Base (Modernist)</strong> y{' '}
            <strong>Modo Primaria (Suave)</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/sistema/estados"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border-2 border-accent-strong text-accent-strong font-heading font-bold text-xs hover:bg-accent-strong hover:text-on-accent transition-colors"
          >
            <TestTube className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Lab de Estados</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface border-2 border-text text-text font-heading font-bold text-xs hover:bg-text hover:text-on-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver al Portal</span>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start min-w-0">
        <ComponentesShowcase
          modo="secundaria"
          titulo="Modo Base (Modernist)"
          subtitulo="Docente, Directivo, Familia y Secundaria: radios 0px, bordes marcados de 2px, acento rojo con contraste garantizado."
        />
        <ComponentesShowcase
          modo="primaria"
          titulo="Modo Primaria (Estilo Suave)"
          subtitulo="Primaria: radios 8/16/24px, acento coral, fondo cálido, zonas táctiles mínimas de 48px."
        />
      </main>

      <footer className="max-w-7xl mx-auto border-t-2 border-divider pt-4 text-xs text-text/60 flex flex-wrap justify-between gap-2">
        <span>Plataforma Educativa con IA — Piloto Córdoba</span>
        <span>Componentes 100% basados en tokens de Tailwind y variables CSS</span>
      </footer>
    </div>
  );
};
