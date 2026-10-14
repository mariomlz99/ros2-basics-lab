// French, Dutch, Spanish, German, Portuguese, Italian. ROS identifiers stay unchanged.
export const odometryTranslations = {
 "Start the simulator and stop any velocity publisher with Ctrl+C. Reset the robot pose, then choose Mark a new start in the odometry notebook. Open Terminal 2 for observations. The notebook reads published /odom samples; its solid path shows where the robot has been and its dashed line joins the start to the current position.": [
  "Démarrez le simulateur et arrêtez tout éditeur de vitesse avec Ctrl+C. Réinitialisez la pose, puis marquez un nouveau départ dans le carnet. Ouvrez le Terminal 2 pour observer. Le carnet lit les messages /odom publiés : le trait plein retrace le parcours et le trait pointillé relie le départ à la position actuelle.",
  "Start de simulator en stop elke snelheidspublisher met Ctrl+C. Herstel de robotpose en markeer een nieuw begin in het notitieboek. Open Terminal 2 voor waarnemingen. Het boek leest gepubliceerde /odom-berichten: de volle lijn toont het gevolgde pad; de stippellijn verbindt het begin met de huidige positie.",
  "Inicia el simulador y detén cualquier publicador de velocidad con Ctrl+C. Restablece la pose y marca un nuevo inicio en el cuaderno. Abre el Terminal 2 para observar. El cuaderno lee mensajes /odom publicados: la línea continua muestra el recorrido y la discontinua une el inicio con la posición actual.",
  "Starte den Simulator und stoppe alle Geschwindigkeitspublisher mit Strg+C. Setze die Pose zurück und markiere einen neuen Start im Notizbuch. Öffne Terminal 2 zum Beobachten. Das Buch liest veröffentlichte /odom-Nachrichten: Die durchgezogene Linie zeigt den Weg, die gestrichelte verbindet Start und aktuelle Position.",
  "Inicia o simulador e para qualquer publicador de velocidade com Ctrl+C. Repõe a pose e marca um novo início no caderno. Abre o Terminal 2 para observar. O caderno lê mensagens /odom publicadas: a linha contínua mostra o percurso e a tracejada liga o início à posição atual.",
  "Avvia il simulatore e ferma ogni publisher di velocità con Ctrl+C. Ripristina la posa e segna un nuovo inizio nel taccuino. Apri il Terminale 2 per osservare. Il taccuino legge i messaggi /odom pubblicati: la linea continua mostra il percorso, quella tratteggiata collega inizio e posizione attuale."
 ],
 "Read the frames before the numbers: pose is in odom; twist is in base_link. pose.pose contains the position and quaternion, while pose.covariance describes uncertainty. Zero covariance here belongs to an ideal simulation. Real odometry is an estimate and can drift; returning to the same reported pose does not prove a real robot returned exactly.": [
  "Lisez les repères avant les nombres : la pose est dans odom, la vitesse dans base_link. pose.pose contient position et quaternion ; pose.covariance décrit l’incertitude. La covariance nulle appartient ici à une simulation idéale. L’odométrie réelle peut dériver : retrouver la même pose annoncée ne prouve pas un retour physique exact.",
  "Lees eerst de frames: pose staat in odom, twist in base_link. pose.pose bevat positie en quaternion; pose.covariance beschrijft onzekerheid. Nulcovariantie hoort hier bij een ideale simulatie. Echte odometrie kan driften: dezelfde gemelde pose bewijst geen exact teruggekeerde robot.",
  "Lee los marcos antes que los números: pose está en odom; twist, en base_link. pose.pose contiene posición y cuaternión; pose.covariance describe incertidumbre. Aquí la covarianza cero corresponde a una simulación ideal. La odometría real puede acumular deriva: repetir la pose indicada no demuestra un retorno físico exacto.",
  "Lies zuerst die Systeme: Die Pose liegt in odom, die Geschwindigkeit in base_link. pose.pose enthält Position und Quaternion; pose.covariance beschreibt Unsicherheit. Nullkovarianz gehört hier zur idealen Simulation. Reale Odometrie kann driften: Dieselbe gemeldete Pose beweist keine exakte physische Rückkehr.",
  "Lê os referenciais antes dos números: pose está em odom; twist, em base_link. pose.pose contém posição e quaternião; pose.covariance descreve a incerteza. A covariância nula pertence aqui a uma simulação ideal. A odometria real pode derivar: repetir a pose indicada não prova um regresso físico exato.",
  "Leggi prima i sistemi: pose è in odom, twist in base_link. pose.pose contiene posizione e quaternione; pose.covariance descrive l’incertezza. La covarianza nulla appartiene qui a una simulazione ideale. L’odometria reale può accumulare deriva: la stessa posa indicata non dimostra un ritorno fisico esatto."
 ],
 "Predict first: drive forward, then reverse along the same line. Will distance from start and path travelled both return to zero? Run forward for about two seconds, inspect in Terminal 2, then stop it with Ctrl+C and send zero velocity.": [
  "Prédisez : avancez, puis reculez sur la même ligne. La distance au départ et le chemin parcouru reviendront-ils tous deux à zéro ? Avancez environ deux secondes, observez dans le Terminal 2, puis arrêtez avec Ctrl+C et envoyez une vitesse nulle.",
  "Voorspel eerst: rijd vooruit en achteruit langs dezelfde lijn. Worden afstand tot het begin en afgelegde weg allebei weer nul? Rijd ongeveer twee seconden vooruit, kijk in Terminal 2, stop met Ctrl+C en stuur snelheid nul.",
  "Predice: avanza y luego retrocede por la misma línea. ¿Volverán a cero tanto la distancia al inicio como el recorrido? Avanza unos dos segundos, observa en el Terminal 2, detén con Ctrl+C y envía velocidad cero.",
  "Vorhersage: Fahre vorwärts und auf derselben Linie zurück. Werden Abstand zum Start und zurückgelegter Weg beide wieder null? Fahre etwa zwei Sekunden, beobachte in Terminal 2, stoppe mit Strg+C und sende Geschwindigkeit null.",
  "Prevê: avança e depois recua pela mesma linha. A distância ao início e o percurso regressarão ambos a zero? Avança cerca de dois segundos, observa no Terminal 2, para com Ctrl+C e envia velocidade zero.",
  "Prevedi: avanza e poi torna indietro sulla stessa linea. Distanza dall’inizio e percorso torneranno entrambi a zero? Avanza per circa due secondi, osserva nel Terminale 2, ferma con Ctrl+C e invia velocità zero."
 ],
 "Now reverse for about the same time, then stop. Path travelled keeps increasing, including in reverse. Distance from start shrinks as you retrace the line. A sampled path is a sum of short straight segments, so it slightly underestimates curves.": [
  "Reculez pendant une durée similaire, puis arrêtez. Le chemin parcouru augmente aussi en marche arrière, tandis que la distance au départ diminue. Le chemin échantillonné additionne de petits segments droits et sous-estime donc légèrement les courbes.",
  "Rijd ongeveer even lang achteruit en stop. De afgelegde weg blijft toenemen, ook achteruit; de afstand tot het begin neemt af. Het bemonsterde pad telt korte rechte stukken op en onderschat bochten daardoor iets.",
  "Retrocede un tiempo similar y detente. El recorrido aumenta también en marcha atrás; la distancia al inicio disminuye. El camino muestreado suma segmentos rectos cortos, por lo que subestima ligeramente las curvas.",
  "Fahre ungefähr genauso lange zurück und halte an. Der zurückgelegte Weg wächst auch rückwärts; der Abstand zum Start sinkt. Der abgetastete Weg summiert kurze gerade Segmente und unterschätzt Kurven leicht.",
  "Recua durante um tempo semelhante e para. O percurso aumenta também em marcha-atrás; a distância ao início diminui. O caminho amostrado soma pequenos segmentos retos, subestimando ligeiramente as curvas.",
  "Torna indietro per un tempo simile e fermati. Il percorso aumenta anche in retromarcia; la distanza dall’inizio diminuisce. Il percorso campionato somma brevi segmenti rettilinei e sottostima leggermente le curve."
 ],
 "Turn in place for roughly two seconds, then stop. Position and path length should barely change while yaw changes. The quaternion z field is not yaw: for a planar rotation, z = sin(yaw/2) and w = cos(yaw/2). Angles are in radians.": [
  "Tournez sur place environ deux secondes, puis arrêtez. Position et chemin parcouru changent à peine, mais yaw change. Le champ z du quaternion n’est pas yaw : en rotation plane, z = sin(yaw/2) et w = cos(yaw/2). Les angles sont en radians.",
  "Draai ongeveer twee seconden op de plaats en stop. Positie en padlengte veranderen nauwelijks; yaw wel. Het quaternionveld z is niet yaw: bij een vlakke rotatie geldt z = sin(yaw/2) en w = cos(yaw/2). Hoeken zijn in radialen.",
  "Gira en el sitio unos dos segundos y detente. Posición y recorrido apenas cambian; yaw sí. El campo z del cuaternión no es yaw: en rotación plana, z = sin(yaw/2) y w = cos(yaw/2). Los ángulos están en radianes.",
  "Drehe etwa zwei Sekunden auf der Stelle und halte an. Position und Weglänge ändern sich kaum, yaw hingegen schon. Quaternion-z ist nicht yaw: Bei ebener Drehung gilt z = sin(yaw/2), w = cos(yaw/2). Winkel sind in Radiant.",
  "Roda no lugar cerca de dois segundos e para. Posição e percurso quase não mudam; yaw muda. O campo z do quaternião não é yaw: numa rotação plana, z = sin(yaw/2) e w = cos(yaw/2). Os ângulos estão em radianos.",
  "Ruota sul posto per circa due secondi e fermati. Posizione e percorso cambiano appena, yaw cambia. Il campo z del quaternione non è yaw: nella rotazione piana, z = sin(yaw/2) e w = cos(yaw/2). Gli angoli sono in radianti."
 ],
 "Drive forward again after the turn. Body velocity still has positive x and zero y, yet both odom coordinates can change. In this planar example, odom vx = body vx × cos(yaw), and odom vy = body vx × sin(yaw). Compare the two velocity rows. For an arc, combine linear.x and angular.z in the same Twist.": [
  "Avancez après le virage. La vitesse du corps garde x positif et y nul, alors que les deux coordonnées odom peuvent changer. Ici, odom vx = vx du corps × cos(yaw), et odom vy = vx du corps × sin(yaw). Comparez les deux lignes. Pour un arc, combinez linear.x et angular.z dans le même Twist.",
  "Rijd na de draai vooruit. De lichaamsnelheid houdt positieve x en nul y, maar beide odom-coördinaten kunnen veranderen. Hier geldt odom vx = lichaam vx × cos(yaw), odom vy = lichaam vx × sin(yaw). Vergelijk beide rijen. Combineer linear.x en angular.z in dezelfde Twist voor een boog.",
  "Avanza tras el giro. La velocidad del cuerpo mantiene x positivo e y cero, pero ambas coordenadas odom pueden cambiar. Aquí odom vx = vx del cuerpo × cos(yaw), odom vy = vx del cuerpo × sin(yaw). Compara las filas. Para un arco, combina linear.x y angular.z en el mismo Twist.",
  "Fahre nach der Drehung vorwärts. Die Körpergeschwindigkeit hat weiter positives x und y null, während sich beide odom-Koordinaten ändern können. Hier gilt odom vx = Körper-vx × cos(yaw), odom vy = Körper-vx × sin(yaw). Vergleiche die Zeilen. Kombiniere linear.x und angular.z im selben Twist für einen Bogen.",
  "Avança após a rotação. A velocidade do corpo mantém x positivo e y zero, mas ambas as coordenadas odom podem mudar. Aqui odom vx = vx do corpo × cos(yaw), odom vy = vx do corpo × sin(yaw). Compara as linhas. Para um arco, combina linear.x e angular.z no mesmo Twist.",
  "Avanza dopo la rotazione. La velocità del corpo mantiene x positivo e y nullo, ma entrambe le coordinate odom possono cambiare. Qui odom vx = vx del corpo × cos(yaw), odom vy = vx del corpo × sin(yaw). Confronta le righe. Per un arco, combina linear.x e angular.z nello stesso Twist."
 ],
 "Build your own observer. The reader below extracts the nested pose and converts its quaternion to yaw. It only observes; keep the simulator running. Create odom_lab once, add the files, and build from the workspace root.": [
  "Construisez votre observateur. Ce lecteur extrait la pose imbriquée et convertit le quaternion en yaw. Il observe seulement ; laissez le simulateur tourner. Créez odom_lab une seule fois, ajoutez les fichiers et compilez depuis la racine de l’espace de travail.",
  "Bouw je eigen waarnemer. Deze lezer haalt de geneste pose op en zet het quaternion om naar yaw. Hij kijkt alleen; laat de simulator draaien. Maak odom_lab eenmaal, voeg de bestanden toe en bouw vanuit de hoofdmap van de workspace.",
  "Crea tu observador. El lector extrae la pose anidada y convierte su cuaternión a yaw. Solo observa; deja activo el simulador. Crea odom_lab una vez, añade los archivos y compila desde la raíz del espacio de trabajo.",
  "Baue deinen Beobachter. Der Leser liest die verschachtelte Pose und wandelt das Quaternion in yaw um. Er beobachtet nur; lass den Simulator laufen. Erstelle odom_lab einmal, füge Dateien hinzu und baue im Hauptverzeichnis des Workspace.",
  "Cria o teu observador. O leitor extrai a pose aninhada e converte o quaternião em yaw. Apenas observa; mantém o simulador ativo. Cria odom_lab uma vez, adiciona os ficheiros e compila na raiz do espaço de trabalho.",
  "Crea il tuo osservatore. Il lettore estrae la posa annidata e converte il quaternione in yaw. Osserva soltanto; lascia attivo il simulatore. Crea odom_lab una volta, aggiungi i file e compila dalla radice del workspace."
 ],
 "Compare the reader with the notebook while moving. Samples arrive at different times, so stop motion before comparing exact values. Ctrl+C stops the reader. Try the useful failure cases: pose.position is not a valid echo field; a fresh terminal needs the workspace install/setup.bash before ros2 run can find odom_lab. Building inside src creates a different install overlay.": [
  "Comparez le lecteur et le carnet pendant le mouvement. Arrêtez le robot pour comparer précisément des échantillons pris à des instants différents. Ctrl+C arrête le lecteur. Essayez ces erreurs utiles : pose.position est invalide ; un nouveau terminal doit sourcer install/setup.bash avant que ros2 run trouve odom_lab. Compiler dans src crée un autre overlay install.",
  "Vergelijk lezer en notitieboek tijdens het rijden. Stop voor een exacte vergelijking: samples komen op verschillende momenten. Ctrl+C stopt de lezer. Onderzoek fouten: pose.position is ongeldig; een nieuwe terminal moet install/setup.bash sourcen voordat ros2 run odom_lab vindt. Bouwen in src maakt een andere install-overlay.",
  "Compara lector y cuaderno en movimiento. Detente para comparar valores exactos: las muestras llegan en momentos distintos. Ctrl+C detiene el lector. Prueba errores útiles: pose.position no es válido; un terminal nuevo debe cargar install/setup.bash para que ros2 run encuentre odom_lab. Compilar en src crea otro overlay install.",
  "Vergleiche Leser und Notizbuch während der Fahrt. Halte für exakte Vergleiche an: Samples kommen zu verschiedenen Zeiten. Strg+C stoppt den Leser. Prüfe Fehler: pose.position ist ungültig; ein neues Terminal muss install/setup.bash laden, damit ros2 run odom_lab findet. Bauen in src erzeugt ein anderes install-Overlay.",
  "Compara leitor e caderno em movimento. Para antes de comparar valores exatos: as amostras chegam em instantes diferentes. Ctrl+C para o leitor. Experimenta erros úteis: pose.position é inválido; um terminal novo deve carregar install/setup.bash para ros2 run encontrar odom_lab. Compilar em src cria outro overlay install.",
  "Confronta lettore e taccuino in movimento. Fermati per confrontare valori esatti: i campioni arrivano in istanti diversi. Ctrl+C ferma il lettore. Prova errori utili: pose.position non è valido; un nuovo terminale deve caricare install/setup.bash perché ros2 run trovi odom_lab. Compilare in src crea un altro overlay install."
 ],
 "Explain the evidence: why can a robot travel a metre and finish near its start? Why can body linear.y stay zero while odom y increases? Why does /odom alone not create a TF relationship? Odometry carries pose and velocity; the simulator separately publishes the matching transform on /tf. Resetting pose is a teaching control, not normal continuous odometry.": [
  "Expliquez : pourquoi parcourir un mètre et finir près du départ ? Pourquoi linear.y du corps reste-t-il nul quand odom y augmente ? Pourquoi /odom ne crée-t-il pas de relation TF ? L’odométrie transporte pose et vitesse ; le simulateur publie séparément la transformation sur /tf. Réinitialiser la pose est un outil pédagogique, pas de l’odométrie continue normale.",
  "Leg uit: waarom kun je een meter rijden en dicht bij het begin eindigen? Waarom blijft lichaam linear.y nul terwijl odom y stijgt? Waarom maakt /odom geen TF-relatie? Odometrie draagt pose en snelheid; de simulator publiceert de transformatie apart op /tf. Pose herstellen is een leermiddel, geen normale continue odometrie.",
  "Explica: ¿por qué recorrer un metro y terminar cerca del inicio? ¿Por qué linear.y del cuerpo sigue en cero mientras odom y aumenta? ¿Por qué /odom no crea una relación TF? La odometría lleva pose y velocidad; el simulador publica la transformación por separado en /tf. Restablecer la pose es un recurso didáctico, no odometría continua normal.",
  "Erkläre: Warum einen Meter fahren und nahe am Start enden? Warum bleibt Körper-linear.y null, während odom y steigt? Warum erzeugt /odom keine TF-Beziehung? Odometrie enthält Pose und Geschwindigkeit; der Simulator veröffentlicht die Transformation getrennt auf /tf. Pose zurücksetzen ist ein Lehrwerkzeug, keine normale kontinuierliche Odometrie.",
  "Explica: porquê percorrer um metro e acabar perto do início? Porque fica linear.y do corpo a zero enquanto odom y aumenta? Porque não cria /odom uma relação TF? A odometria contém pose e velocidade; o simulador publica a transformação separadamente em /tf. Repor a pose é um recurso didático, não odometria contínua normal.",
  "Spiega: perché percorrere un metro e finire vicino all’inizio? Perché linear.y del corpo resta nullo mentre odom y aumenta? Perché /odom non crea una relazione TF? L’odometria contiene posa e velocità; il simulatore pubblica separatamente la trasformazione su /tf. Ripristinare la posa è uno strumento didattico, non normale odometria continua."
 ],
 "Odometry | motion detective": [
  "Odométrie | enquête sur le mouvement",
  "Odometrie | bewegingsdetective",
  "Odometría | detective del movimiento",
  "Odometrie | Bewegungsdetektiv",
  "Odometria | detetive do movimento",
  "Odometria | investigatore del movimento"
 ],
 "ODOMETRY NOTEBOOK": [
  "CARNET D’ODOMÉTRIE",
  "ODOMETRIENOTITIEBOEK",
  "CUADERNO DE ODOMETRÍA",
  "ODOMETRIE-NOTIZBUCH",
  "CADERNO DE ODOMETRIA",
  "TACCUINO DI ODOMETRIA"
 ],
 "How far is “back where you started”?": [
  "Quelle distance pour « revenir au départ » ?",
  "Hoe ver is “terug bij het begin”?",
  "¿Qué distancia hay en «volver al inicio»?",
  "Wie weit ist „zurück zum Start“?",
  "Que distância tem «voltar ao início»?",
  "Quanto è lontano «tornare all’inizio»?"
 ],
 "One published pose. Two ways to describe motion.": [
  "Une pose publiée. Deux descriptions du mouvement.",
  "Eén gepubliceerde pose. Twee beschrijvingen van beweging.",
  "Una pose publicada. Dos descripciones del movimiento.",
  "Eine veröffentlichte Pose. Zwei Beschreibungen der Bewegung.",
  "Uma pose publicada. Duas descrições do movimento.",
  "Una posa pubblicata. Due descrizioni del movimento."
 ],
 "Mark a new start": [
  "Marquer un nouveau départ",
  "Nieuw begin markeren",
  "Marcar un nuevo inicio",
  "Neuen Start markieren",
  "Marcar um novo início",
  "Segna un nuovo inizio"
 ],
 "Recorded odometry path": [
  "Parcours odométrique enregistré",
  "Opgenomen odometriepad",
  "Trayectoria odométrica registrada",
  "Aufgezeichneter Odometrieweg",
  "Percurso odométrico registado",
  "Percorso odometrico registrato"
 ],
 "Solid: sampled path · Dashed: displacement": [
  "Plein : parcours échantillonné · Pointillé : déplacement",
  "Vol: bemonsterd pad · Stippels: verplaatsing",
  "Continua: recorrido muestreado · Discontinua: desplazamiento",
  "Durchgezogen: abgetasteter Weg · Gestrichelt: Verschiebung",
  "Contínua: percurso amostrado · Tracejada: deslocamento",
  "Continua: percorso campionato · Tratteggiata: spostamento"
 ],
 "Path travelled": [
  "Chemin parcouru",
  "Afgelegde weg",
  "Recorrido",
  "Zurückgelegter Weg",
  "Percurso",
  "Percorso"
 ],
 "Distance from start": [
  "Distance au départ",
  "Afstand tot begin",
  "Distancia al inicio",
  "Abstand zum Start",
  "Distância ao início",
  "Distanza dall’inizio"
 ],
 "Heading": [
  "Cap",
  "Richting",
  "Orientación",
  "Ausrichtung",
  "Orientação",
  "Orientamento"
 ],
 "Pose · odom": [
  "Pose · odom",
  "Pose · odom",
  "Pose · odom",
  "Pose · odom",
  "Pose · odom",
  "Posa · odom"
 ],
 "Velocity · base_link": [
  "Vitesse · base_link",
  "Snelheid · base_link",
  "Velocidad · base_link",
  "Geschwindigkeit · base_link",
  "Velocidade · base_link",
  "Velocità · base_link"
 ],
 "Velocity · odom": [
  "Vitesse · odom",
  "Snelheid · odom",
  "Velocidad · odom",
  "Geschwindigkeit · odom",
  "Velocidade · odom",
  "Velocità · odom"
 ],
 "Start the simulator to record /odom.": [
  "Démarrez le simulateur pour enregistrer /odom.",
  "Start de simulator om /odom op te nemen.",
  "Inicia el simulador para registrar /odom.",
  "Starte den Simulator, um /odom aufzuzeichnen.",
  "Inicia o simulador para registar /odom.",
  "Avvia il simulatore per registrare /odom."
 ],
 "Paused · last recorded sample": [
  "Pause · dernier échantillon",
  "Gepauzeerd · laatste sample",
  "Pausa · última muestra",
  "Pausiert · letztes Sample",
  "Pausa · última amostra",
  "Pausa · ultimo campione"
 ],
 "Live /odom · recording published poses": [
  "/odom en direct · poses publiées enregistrées",
  "Live /odom · gepubliceerde poses opnemen",
  "/odom en directo · registrando poses publicadas",
  "/odom live · veröffentlichte Posen aufzeichnen",
  "/odom em direto · a registar poses publicadas",
  "/odom dal vivo · registrazione delle pose pubblicate"
 ],
 "Live /odom · showing the latest 600 path points": [
  "/odom en direct · 600 derniers points",
  "Live /odom · laatste 600 padpunten",
  "/odom en directo · últimos 600 puntos",
  "/odom live · letzte 600 Wegpunkte",
  "/odom em direto · últimos 600 pontos",
  "/odom dal vivo · ultimi 600 punti"
 ],
 "Sampled path length is approximate. This simulator publishes ideal pose and zero covariance; real odometry can drift.": [
  "Le chemin échantillonné est approximatif. Le simulateur publie une pose idéale et une covariance nulle ; l’odométrie réelle peut dériver.",
  "De bemonsterde padlengte is bij benadering. Deze simulator publiceert een ideale pose en nulcovariantie; echte odometrie kan driften.",
  "El recorrido muestreado es aproximado. El simulador publica pose ideal y covarianza cero; la odometría real puede acumular deriva.",
  "Die abgetastete Weglänge ist näherungsweise. Der Simulator veröffentlicht ideale Pose und Nullkovarianz; reale Odometrie kann driften.",
  "O percurso amostrado é aproximado. O simulador publica pose ideal e covariância nula; a odometria real pode derivar.",
  "Il percorso campionato è approssimativo. Il simulatore pubblica posa ideale e covarianza nulla; l’odometria reale può accumulare deriva."
 ],
 "New recording after a sample gap": [
  "Nouvel enregistrement après une interruption des échantillons",
  "Nieuwe opname na ontbrekende samples",
  "Nuevo registro tras una interrupción de muestras",
  "Neue Aufzeichnung nach einer Sample-Lücke",
  "Novo registo após uma falha de amostras",
  "Nuova registrazione dopo un intervallo senza campioni"
 ]
};
