
import { Rank, Achievement, Phase } from './types';

export const INITIAL_START_DATE = '2025-12-28T00:00:00.000Z';

export const RANKS_THRESHOLDS: Record<Rank, number> = {
  [Rank.RECRUIT]: 0,
  [Rank.SOLDIER]: 2,
  [Rank.SPECIALIST]: 5,
  [Rank.SERGEANT]: 10,
  [Rank.LIEUTENANT]: 15,
  [Rank.COMMANDER]: 25,
  [Rank.LEGEND]: 50,
};

// Traducciones para visualización
export const RANK_TRANSLATIONS: Record<Rank, string> = {
  [Rank.RECRUIT]: 'RECLUTA',
  [Rank.SOLDIER]: 'SOLDADO',
  [Rank.SPECIALIST]: 'ESPECIALISTA',
  [Rank.SERGEANT]: 'SARGENTO',
  [Rank.LIEUTENANT]: 'TENIENTE',
  [Rank.COMMANDER]: 'COMANDANTE',
  [Rank.LEGEND]: 'LEYENDA',
};

export const PHASE_TRANSLATIONS: Record<Phase, string> = {
  [Phase.ATTACK]: 'ATAQUE (SEMANAL)',
  [Phase.TRANSITION]: 'TRANSICIÓN (QUINCENAL)',
  [Phase.MAINTENANCE]: 'MANTENIMIENTO (MENSUAL)',
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: 'PRIMERA SANGRE', description: 'Completa tu primera misión.', icon: 'Droplet', unlocked: false },
  { id: 'sniper', title: 'FRANCOTIRADOR', description: 'Completa una sesión de degradado de hombros.', icon: 'Crosshair', unlocked: false },
  { id: 'dawn_raid', title: 'INCURSIÓN AL ALBA', description: 'Completa una sesión antes de las 10:00.', icon: 'Sun', unlocked: false },
  { id: 'black_ops', title: 'OPERACIONES NEGRAS', description: 'Completa una sesión después de las 22:00.', icon: 'Moon', unlocked: false },
  { id: 'endurance', title: 'RESISTENCIA', description: 'Sesión superior a 40 minutos.', icon: 'Shield', unlocked: false },
  { id: 'blitzkrieg', title: 'ATAQUE RÁPIDO', description: 'Sesión de menos de 15 minutos.', icon: 'Zap', unlocked: false },
  { id: 'blue_monday', title: 'BLUE MONDAY', description: 'Completa una sesión de piernas en Lunes.', icon: 'Calendar', unlocked: false },
  { id: 'roi_breached', title: 'RENTABLE', description: 'Recupera el coste de la máquina.', icon: 'DollarSign', unlocked: false },
];

export const PHASE_CONFIG = {
  [Phase.ATTACK]: { weeks: 12, frequency: 'WEEKLY' },
  [Phase.TRANSITION]: { weeks: 12, frequency: 'BI-WEEKLY' },
  [Phase.MAINTENANCE]: { weeks: 999, frequency: 'MONTHLY' },
};

export const ZONES = {
  LOWER: ['Muslos', 'Rodillas', 'Glúteos'], // Lunes: Fuerza Bruta
  UPPER: ['Pecho', 'Abdomen'], // Domingo: Precisión
  SHOULDER_ADDON: ['Hombros', 'Brazos (Degradado)']
};

// --- BASE DE DATOS DE INTELIGENCIA TÁCTICA (150 REGISTROS) ---
export const BRIEFING_DATABASE = {
  // CATEGORÍA A: DOMINGO (TREN SUPERIOR / PRECISIÓN)
  SUNDAY_OPS: [
    "OPERACIÓN ESCUDO: Hoy el objetivo es el torso. Mantén el cabezal a 90 grados. La precisión en el pecho dictará la calidad del resultado final.",
    "PROTOCOLO DEGRADADO: Toca hombros. No busques eliminación total; busca transición. Un patrón de damero es la clave para un look natural.",
    "INCURSIÓN TORSO: Pectorales y abdomen en el visor. Recuerda: solapa los disparos un 20% para no dejar 'huellas' de vello.",
    "FILTRO DE FOTONES: El esternón es zona sensible. Aprieta el cabezal para engañar al nervio y minimizar el impacto térmico.",
    "OBJETIVO ACROMION: Define la frontera en el hombro. Más allá de la línea de la axila, el vello es territorio aliado. No dispares.",
    "LIMPIEZA DE SUPERFICIE: Abdomen bajo en el punto de mira. Tensa la piel para que el haz de luz llegue directo al folículo.",
    "ESTRATEGIA DE TRANSICIÓN: En los hombros, menos es más. Reducir densidad es la misión; la calvicie total ahí se ve artificial.",
    "FOCO PECS: Filas verticales ordenadas. No dispares al azar o dejarás parches. Disciplina en el barrido.",
    "INTEL DE HOMBROS: Recorta al 1mm antes de disparar. El pelo largo disipa la energía y reduce la efectividad del impacto.",
    "MISIÓN DOMINICAL: Sesión corta pero técnica. La calma del domingo es ideal para el mapeo preciso del torso.",
    "MAPEO DE DORSALES: Si llegas al lateral del torso, usa el espejo. La simetría es la marca de un operador de élite.",
    "ZONA CLAVE: OMBLIGO: Cuidado con las irregularidades. Asegura contacto total o el sensor de seguridad bloqueará el disparo.",
    "TACTIC PECS: Inicia por el centro del pecho y expande hacia afuera. Mantén el ritmo del metrónomo.",
    "BRAZO SUPERIOR: El tríceps alto suele tener vello rebelde. Gira el brazo para exponer el flanco antes de disparar.",
    "HIDRATACIÓN PREVIA: Asegúrate de haber bebido agua. Una piel hidratada internamente gestiona mejor el calor del pulso.",
    "MODO ESCANEO: No mires el flash directamente. Usa el HUD de la app para confirmar que el tiempo de recarga ha terminado.",
    "ESTERNÓN CRÍTICO: La piel es fina sobre el hueso. Disparo único, sin solapamiento excesivo en esta zona.",
    "LÍNEA ALBA: El centro del abdomen concentra más melanina. Potencia estable, ejecución quirúrgica.",
    "FLANCO ABDOMINAL: Gira el torso para estirar los oblicuos. Facilitará que el cabezal se asiente perfectamente.",
    "REPORTE DE TORSO: Cada domingo es un paso hacia un torso de acero. No descuides los laterales.",
    "MANIOBRA DE AXILA: Detente justo en el pliegue. El vello de la axila requiere un protocolo distinto no cubierto hoy.",
    "PRECISIÓN CLAVICULAR: Mueve el cabezal siguiendo la línea del hueso. Evita disparos al aire.",
    "CONTROL DE CALOR: Si el cristal quema demasiado, haz una pausa de 30 segundos. Deja que los ventiladores hagan su trabajo.",
    "BARRIDO INFERIOR: Desde el ombligo hasta la línea del cinturón. Es una zona de crecimiento rápido; sé meticuloso.",
    "LOGÍSTICA DE DOMINGO: Revisa que el sensor de piel esté limpio. Restos de vello quemado reducen la potencia del haz.",
    "SIMETRÍA TÁCTICA: Empieza por el lado izquierdo para mantener un orden lógico en tu registro mental.",
    "TENSIÓN CUTÁNEA: Usa la mano libre para estirar la piel del abdomen. Menos arrugas significan disparos más profundos.",
    "MODO SILENCIOSO: El domingo es para la técnica. Escucha el sonido de carga de los condensadores.",
    "REPASO DE FRONTERA: Mira bien el degradado de la semana pasada. ¿Necesitas ajustar el patrón de disparo hoy?",
    "FIN DE MISIÓN TORSO: Objetivo neutralizado. Aplica Aloe Vera y prepárate para la carga de piernas de mañana."
  ],
  // CATEGORÍA B: LUNES (TREN INFERIOR / FUERZA BRUTA)
  MONDAY_OPS: [
    "BLUE MONDAY SURVIVAL: El lunes se vence con fuego. Ataca las piernas con potencia máxima. La pereza es el enemigo.",
    "OPERACIÓN TITÁN: Muslos en el visor. Es la zona más extensa. Activa el modo de disparo continuo y no te detengas.",
    "ZONA DE IMPACTO: ESPINILLAS: Alerta de dolor. Sobre el hueso, la absorción es mayor. Baja un nivel de potencia si el impacto es excesivo.",
    "BARRIDO DE GEMELOS: Asegúrate de cubrir la parte posterior. Usa el espejo de suelo para no dejar flancos expuestos.",
    "ASALTO TOTAL: Piernas y glúteos. Es la sesión más larga de la semana. Mantén la hidratación y el ritmo constante.",
    "FUEGO DE SUPRESIÓN: No des tregua a los folículos de los cuádriceps. Son profundos y requieren disparos contundentes.",
    "LOGÍSTICA DE LUNES: Has rasurado anoche. La piel está lista. Ejecuta la secuencia antes de que la fatiga del día te alcance.",
    "MISIÓN RESISTENCIA: 40 minutos de operación. El metrónomo es tu guía. Dispara, desliza, repite.",
    "FLANCO POSTERIOR: Los glúteos requieren paciencia. Usa el tacto para guiar el cabezal donde la vista no llega.",
    "MANIOBRA DE RODILLA: Dobla la articulación para tensar la piel. Un folículo estirado es un objetivo más fácil de neutralizar.",
    "FUERZA EN CUÁDRICEPS: Divide el muslo en tres franjas verticales. Cubre una a una para no perderte.",
    "LOGÍSTICA DE GLÚTEOS: Usa el espejo de mano. La retaguardia no debe quedar con parches de vello.",
    "AVANCE EN TOBILLOS: Piel muy fina. Disparos lentos y precisos. No hay prisa en las zonas articuladas.",
    "RESISTENCIA AL IMPACTO: El lunes es duro, pero los resultados en las piernas son los más satisfactorios. Dale caña.",
    "BARRIDO CONTINUO: Activa el modo ráfaga si tu máquina lo permite. Desliza suavemente sin levantar el equipo.",
    "INTEL DE MUSLO INTERIOR: Piel más clara y sensible. Ajusta la potencia si sientes una mordida térmica excesiva.",
    "HUECO POPLÍTEO: Detrás de la rodilla la piel es delicada. No solapes disparos ahí. Un impacto es suficiente.",
    "CADENCIA DE LUNES: Mantén el paso. Si te cansas, cambia de pierna. Mantén la sangre fluyendo.",
    "ZONA DE ENTRENAMIENTO: Considera esta sesión como parte de tu entrenamiento semanal. Quemas vello, ganas disciplina.",
    "EQUILIBRIO TÁCTICO: Asegúrate de que ambas piernas reciben la misma dosis de fotones.",
    "ASALTO LATERAL: No olvides el flanco externo del muslo. Es donde el vello suele ser más denso.",
    "MODO PESADO: Hoy es el día de mayor consumo de disparos. Verifica que la batería (o cable) esté estable.",
    "PSICOLOGÍA DEL LUNES: El dolor es temporal, la suavidad es para siempre. Ejecuta sin dudar.",
    "MAREJADA TÉRMICA: Si las piernas se calientan mucho, usa una toalla húmeda fría entre zonas.",
    "OBJETIVO: ISQUIOTIBIALES: La parte trasera del muslo es difícil de ver. Siéntate en el borde de una silla para tensar.",
    "LIMPIEZA POST-COMBATE: Al terminar, Aloe Vera de la cadera al tobillo. La piel lo agradecerá.",
    "DISCIPLINA DE MOVILIDAD: Muévete para alcanzar cada ángulo. Tu agilidad es parte de la operación.",
    "ZONA DE PENUMBRA: El muslo superior cerca de la ingle. Detente antes de la zona sensible prohibida.",
    "REPORTE DE GEMELOS: Si el pelo es muy negro, prepárate para un impacto sonoro fuerte. Es normal.",
    "FIN DE TRANSMISIÓN LUNES: Operación de volumen completada. Has superado el Blue Monday con éxito."
  ],
  // CATEGORÍA C: FASE 1 (ATAQUE)
  PHASE_1: [
    "INICIO DE HOSTILIDADES: Todo lo que dispares hoy tardará 14 días en caer. No busques resultados inmediatos; busca ejecución.",
    "BOMBARDEO SEMANAL: Estamos en fase de ataque. La constancia es el único camino hacia la victoria capilar.",
    "ALERTA DE REBROTE: El pelo saldrá más fuerte antes de morir. Es una reacción de defensa. Sigue disparando.",
    "PROTOCOLO ANÁGENO: Estamos sincronizando los ciclos de crecimiento. No te saltes ni una sesión o perderás la ventaja táctica.",
    "GUERRA DE DESGASTE: Los folículos se debilitan con cada impacto. Aunque no lo veas, el daño estructural es masivo.",
    "ESTADO DE SITUACIÓN: Semana 4. Deberías empezar a ver las primeras brechas en la formación del vello.",
    "ATAQUE QUIRÚRGICO: No dejes ni un milímetro sin tratar. La Fase 1 es para no dejar supervivientes.",
    "PERSISTENCIA OPERATIVA: La piel puede estar seca. Usa Aloe Vera tras el fuego, pero nunca antes.",
    "INTEL DE CAMPAÑA: El vello grueso es el mejor objetivo para el láser. Tu perfil de vello es ideal para esta operación.",
    "RECALIBRADO TÁCTICO: Si el dolor baja, sube la potencia. Si no hay calor, no hay victoria.",
    "BOMBARDEO DE ENERO: El frío del invierno ayuda a mantener la piel sin irritación post-sesión. Aprovecha.",
    "FASE DE DEMOLICIÓN: Estamos destruyendo la infraestructura del folículo. Sé implacable.",
    "SISTEMA DE RACHAS: 4 semanas sin fallar te dan el rango de Especialista. Mantén el ritmo.",
    "SIN TREGUA: Aunque veas pocas zonas con pelo, dispara en toda la superficie. Hay folículos invisibles acechando.",
    "REGLA DE ORO: Rasurado perfecto = Sesión indolora. No escatimes en cuchillas nuevas.",
    "INERCIA TÁCTICA: Lo más difícil es empezar la sesión. Una vez disparas el primero, el resto es automático.",
    "FOTOTIPO BAJO CONTROL: Revisa tu tono de piel cada mes. En invierno sueles estar más claro, permitiendo más potencia.",
    "ESTRATEGIA DE INVIERNO: Esta es la temporada donde se ganan las batallas del verano. Disciplina.",
    "SENSOR DE CALOR: Si la máquina huele a quemado, limpia el cristal. Son restos de queratina bloqueando el haz.",
    "OBJETIVO: ATROFIA: El vello que salga ahora será más fino y claro. Es señal de que el folículo se está atrofiando.",
    "PROTOCOLO DE SUEÑO: Intenta descansar tras la sesión. El cuerpo repara la piel durante el ciclo REM.",
    "INFORME DE DAÑOS: ¿Ves zonas rojas persistentes? Baja un punto la potencia la semana que viene.",
    "MANTENIMIENTO DE EQUIPO: Revisa la lente. Un cristal rayado dispersa la luz y reduce la efectividad.",
    "FASE 1: SEMANA 8: Estás en el ecuador de la fase de ataque. La victoria está a la vista.",
    "INTEL DE CRECIMIENTO: El pelo no crece todo a la vez. Por eso atacamos cada semana sin falta.",
    "DISPARO ÚNICO: No pases dos veces por el mismo sitio en la misma sesión. Irritación innecesaria.",
    "ORDEN DE BATALLA: Prepara el área, apaga distracciones, ponte las gafas. Foco total.",
    "BIOHACKING ESTÉTICO: Estás usando tecnología para alterar tu biología. Respeta el proceso.",
    "COMUNICACIÓN HQ: Consulta al oficial IA si notas cambios inusuales en la piel. Seguridad primero.",
    "FINAL DE ATAQUE: Semana 12 en el horizonte. Prepárate para bajar la frecuencia pronto."
  ],
  // CATEGORÍA D: FASES 2 Y 3 (TRANSICIÓN Y MANTENIMIENTO)
  PHASE_2_3: [
    "MODO FRANCOTIRADOR: Fase 2. Solo disparamos donde vemos actividad. Eficiencia sobre volumen.",
    "VIGILANCIA QUINCENAL: No bajaremos la guardia. Una sesión cada 14 días para eliminar rezagados.",
    "CONTROL DE DAÑOS: Busca las 'islas' de vello que sobrevivieron al invierno. Atácalas con potencia máxima.",
    "ESTADO: MANTENIMIENTO: Solo una vez al mes. Es un recordatorio para los folículos de quién manda aquí.",
    "OPERACIÓN VERANO: Estamos en Fase 3. La piel debe lucir perfecta. Sesiones de retoque rápido.",
    "RECOLECCIÓN DE INTEL: Anota dónde sale el pelo más fuerte en fase de mantenimiento. Será tu objetivo prioritario.",
    "FASE QUINCENAL: Disfruta del tiempo libre extra, pero no olvides marcar el calendario.",
    "REPASO DE SOMBRAS: Si el vello es casi invisible pero se siente al tacto, dispara.",
    "ESTADO ALFA: Tu densidad capilar es mínima. Has alcanzado el estatus de veterano.",
    "INTEL DE PRIMAVERA: La luz aumenta. No olvides el protector solar aunque no vayas a la playa.",
    "MANTENIMIENTO DE BRAZOS: El degradado debe revisarse cada mes para que no pierda la forma natural.",
    "SESIÓN DE RETOQUE: 10 minutos son suficientes ahora. Calidad sobre cantidad.",
    "EQUIPO EN RESERVA: Limpia la máquina y guárdala en un lugar seco. Ya no la necesitas a diario.",
    "VIGILANCIA DE REBROTE: Cambios hormonales o estrés pueden despertar folículos. Dispara sin piedad si ocurre.",
    "OPERACIÓN PIEL DE SEDA: Has completado el ciclo. La textura de tu piel es ahora tu armadura.",
    "ZONA DE CONFORT: No te relajes demasiado. Un descuido de 3 meses puede reactivar zonas.",
    "REPORTE DE LOGROS: Has ahorrado cientos de euros en clínicas. Tu ROI es positivo.",
    "CONTROL DE POTENCIA: En mantenimiento, la potencia máxima es obligatoria para sellar el resultado.",
    "FASE 3: SEPTIEMBRE: Tras el verano, vuelve al ataque suave para corregir el daño solar.",
    "SISTEMA EN STANDBY: Buen trabajo. Operación exitosa. Mantén el sensor UV activo.",
    "INTEL DE CICLO: El vello tiene memoria. No le des tiempo para recordar cómo crecer.",
    "ESTÉTICA TÁCTICA: Tu definición muscular es ahora más visible sin la interferencia del vello.",
    "FASE DE CRUCERO: Ya no es una guerra, es una patrulla de rutina. Mantén el orden.",
    "EXCEPCIÓN DE AGOSTO: Si el sol es extremo, aborta. Retomaremos en septiembre.",
    "MEDALLA DE VETERANO: Has seguido el plan 6 meses. Rango de Comandante alcanzado."
  ],
  // CATEGORÍA E: SEGURIDAD Y ALERTAS UV
  SAFETY: [
    "TORMENTA SOLAR: Índice UV por encima de 6. Si has estado expuesto hoy, suspende la misión. El riesgo de quemadura es real.",
    "ALERTA DE BRONCEADO: Si tu piel ha cambiado de tono, la máquina no distinguirá el pelo del tejido. Procede con cautela extrema.",
    "OPERACIÓN SIGILO SOLAR: Has evitado el sol. Las condiciones para el disparo son óptimas. Fuego autorizado.",
    "SENSOR CRÍTICO: UV nivel 8 detectado. La piel está estresada térmicamente. Aplica hidratación y cancela el IPL hoy.",
    "VENTANA DE OPORTUNIDAD: UV bajo. Es el momento ideal para atacar zonas sensibles sin riesgo de fotosensibilidad.",
    "INTEL DE FOTOPROTECCIÓN: Si vas a salir tras la sesión, usa ropa que cubra las zonas tratadas. La piel está 'indefensa'.",
    "SEGURIDAD OCULAR: ¿Tienes puestas las gafas? El haz de luz puede dañar la retina por rebote. No te la juegues.",
    "ALERTA DE IRRITACIÓN: Si la piel está roja antes de empezar, aborta misión. No dispares sobre tejido inflamado.",
    "CONTROL DE LUNARES: Cubre los lunares oscuros con lápiz blanco. Evita que absorban el impacto del láser.",
    "SENSOR DE CONTACTO: Si la máquina no dispara, no fuerces. Revisa el ángulo de ataque.",
    "ESTRATEGIA POST-SOL: Si fuiste a la playa hace menos de 48h, tu piel aún tiene calor residual. Espera.",
    "ZONA DE PELIGRO: Evita disparar sobre tatuajes. El láser destruirá el pigmento y tu piel.",
    "INTEL DE MEDICAMENTOS: Algunos fármacos causan fotosensibilidad. Revisa tu prospecto antes del fuego.",
    "HIDRATACIÓN DE EMERGENCIA: Si sientes quemazón post-disparo, usa agua termal o compresas frías.",
    "REGLA DE LAS 72H: No expongas al sol directo las zonas tratadas durante al menos 3 días."
  ],
  // CATEGORÍA F: MOTIVACIÓN Y "FLAVOR" TÁCTICO
  FLAVOR: [
    "ENLACE ESTABLECIDO: Comandante, el equipo está al 100%. Los condensadores están cargados. Inicie la secuencia.",
    "BIOHACKING ACTIVO: Estamos reprogramando tu estética. La disciplina de hoy es el orgullo de mañana.",
    "DISCIPLINA FÉRREA: No eres un usuario, eres un operador. Cumple el horario y los resultados llegarán.",
    "INTEL DE MERCADO: Cada disparo te ahorra dinero en clínicas. Tu ROI está aumentando con cada minuto de sesión.",
    "SISTEMA ONLINE: Sensores térmicos listos. Metrónomo sincronizado. Proceda al área de operaciones.",
    "SIN DOLOR NO HAY GLORIA: El calor es la señal de que el folículo está siendo neutralizado. Soporta el impacto.",
    "REPORTE DE ESTADO: Rango actual: Recluta. Completa esta sesión para ascender en la jerarquía.",
    "TECNOLOGÍA DE PUNTA: Tienes en tus manos potencia que hace una década solo existía en hospitales. Úsala bien.",
    "ORDEN DEL DÍA: Rasurar, Disparar, Hidratar. Repetir hasta la victoria total.",
    "FIN DE TRANSMISIÓN: La charla ha terminado. Es hora de que el láser hable por ti. ¡A por ellos!",
    "ESPÍRITU DE CUERPO: Miles de hombres están en esta misma batalla hoy. No eres el único, sé el mejor.",
    "INTEL PSICOLÓGICA: El cerebro intentará convencerte de que hoy no hace falta. Ignóralo. Es el miedo al éxito.",
    "MAESTRÍA TÉCNICA: Un operador hábil conoce su equipo. ¿Sabes cuántos julios entrega tu máquina?",
    "OBJETIVO: PERFECCIÓN: La diferencia entre lo bueno y lo excelente es el último 10% de esfuerzo.",
    "LEGADO TÁCTICO: En unos meses, esta rutina será solo un recuerdo y tu piel será el trofeo.",
    "CONEXIÓN ESTABLE: Uplink con Gemini verificado. El oficial de inteligencia está supervisando tu progreso.",
    "FACTOR DE ÉXITO: La paciencia gana guerras. No busques el resultado hoy, busca la ejecución perfecta.",
    "CÓDIGO DE HONOR: Has hecho una promesa a tu yo del futuro. Cúmplela hoy.",
    "INFORME FINAL: Has superado la barrera de la duda. Ahora eres un operador de élite.",
    "VICTORIA TOTAL: El vello ha sido derrotado. Eres el dueño de tu estética. Fin del programa."
  ]
};

export const WEEKLY_INTEL: Record<number, string> = {}; // Deprecated but kept for type safety if needed, empty now.
