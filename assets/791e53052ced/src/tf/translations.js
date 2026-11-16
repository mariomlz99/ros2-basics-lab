// French, Dutch, Spanish, German, Portuguese, Italian. ROS identifiers stay unchanged.
export const tfTranslations = {
"Prepare this unit to create the small tf_lab package and starter files. Keep the simulator running. The listener receives TF into a Buffer; a timer lets incoming transforms arrive before each lookup. This program prints twice per second. If TF is unavailable it reports the missing frame and waits; starting or restarting the simulator resumes readings. Ctrl+C or Stop ends the reader.": ["Préparez cette unité pour créer le petit paquet tf_lab et ses fichiers initiaux. Gardez le simulateur actif. Le listener reçoit TF dans un Buffer ; un timer laisse arriver les transformations avant chaque lecture. Ce programme affiche deux fois par seconde. Si TF est indisponible, il signale le repère manquant et attend ; démarrer ou redémarrer le simulateur reprend les lectures. Ctrl+C ou Stop termine le lecteur.","Bereid deze eenheid voor om het kleine pakket tf_lab en de startbestanden te maken. Laat de simulator draaien. De listener ontvangt TF in een Buffer; een timer laat transformaties aankomen vóór elke opvraag. Dit programma toont tweemaal per seconde uitvoer. Als TF ontbreekt, meldt het het ontbrekende frame en wacht; bij het starten of herstarten van de simulator worden de metingen hervat. Ctrl+C of Stop beëindigt de lezer.","Prepara esta unidad para crear el pequeño paquete tf_lab y los archivos iniciales. Mantén el simulador activo. El listener recibe TF en un Buffer; un temporizador permite que lleguen las transformaciones antes de cada consulta. Este programa imprime dos veces por segundo. Si TF no está disponible, indica el marco que falta y espera; iniciar o reiniciar el simulador reanuda las lecturas. Ctrl+C o Stop termina el lector.","Bereite diese Einheit vor, um das kleine Paket tf_lab und die Startdateien anzulegen. Lass den Simulator laufen. Der Listener empfängt TF in einem Buffer; ein Timer lässt Transformationen vor jeder Abfrage eintreffen. Das Programm gibt zweimal pro Sekunde Werte aus. Ist TF nicht verfügbar, meldet es das fehlende Koordinatensystem und wartet; beim Start oder Neustart des Simulators werden die Abfragen fortgesetzt. Ctrl+C oder Stop beendet den Leser.","Prepara esta unidade para criar o pequeno pacote tf_lab e os ficheiros iniciais. Mantém o simulador ativo. O listener recebe TF num Buffer; um temporizador permite que as transformações cheguem antes de cada consulta. Este programa imprime duas vezes por segundo. Se TF não estiver disponível, indica o referencial em falta e espera; iniciar ou reiniciar o simulador retoma as leituras. Ctrl+C ou Stop termina o leitor.","Prepara questa unità per creare il piccolo pacchetto tf_lab e i file iniziali. Mantieni attivo il simulatore. Il listener riceve TF in un Buffer; un timer lascia arrivare le trasformazioni prima di ogni lettura. Il programma stampa due volte al secondo. Se TF non è disponibile, segnala il sistema di riferimento mancante e attende; avviare o riavviare il simulatore riprende le letture. Ctrl+C o Stop termina il lettore."],
"Run the starter unchanged once. It deliberately asks for laser, which is not a frame in this tree. Expect a clear TF lookup failure. The reader keeps waiting; stop it before editing. Inspect the tree and change laser to laser_link. Save, rebuild, source and run again using the commands below. Expect x = 0.12, y = 0.00 m.": ["Exécutez une fois le code initial sans le modifier. Il demande volontairement laser, absent de cet arbre. Attendez-vous à une erreur TF explicite. Le lecteur continue d’attendre ; arrêtez-le avant de modifier le code. Consultez l’arbre et remplacez laser par laser_link. Enregistrez, reconstruisez, sourcez et relancez avec les commandes ci-dessous. Résultat attendu : x = 0.12, y = 0.00 m.","Voer de starter eerst ongewijzigd uit. Die vraagt bewust naar laser, dat niet in deze boom staat. Verwacht een duidelijke TF-fout. De lezer blijft wachten; stop hem voordat je de code bewerkt. Bekijk de boom en vervang laser door laser_link. Sla op, bouw opnieuw, source de omgeving en voer de onderstaande opdrachten uit. Verwacht x = 0.12, y = 0.00 m.","Ejecuta una vez el código inicial sin cambios. Pide laser deliberadamente, ausente de este árbol. Espera un error TF claro. El lector sigue esperando; detenlo antes de editar. Revisa el árbol y cambia laser por laser_link. Guarda, recompila, carga el entorno y ejecuta los comandos de abajo. Espera x = 0.12, y = 0.00 m.","Führe den Startcode einmal unverändert aus. Er fragt absichtlich nach laser, das in diesem Baum fehlt. Erwarte einen eindeutigen TF-Fehler. Der Leser wartet weiter; stoppe ihn vor dem Bearbeiten. Prüfe den Baum und ersetze laser durch laser_link. Speichere, baue erneut, lade die Umgebung mit source und starte mit den Befehlen unten. Erwartet: x = 0.12, y = 0.00 m.","Executa o código inicial uma vez sem alterações. Pede laser de propósito, ausente desta árvore. Espera um erro TF claro. O leitor continua à espera; para-o antes de editar. Consulta a árvore e muda laser para laser_link. Guarda, recompila, carrega o ambiente e executa os comandos abaixo. Espera x = 0.12, y = 0.00 m.","Esegui una volta il codice iniziale senza modificarlo. Richiede apposta laser, assente in questo albero. Aspettati un chiaro errore TF. Il lettore continua ad attendere; fermalo prima di modificare il codice. Controlla l’albero e cambia laser in laser_link. Salva, ricompila, carica l’ambiente ed esegui i comandi sotto. Risultato atteso: x = 0.12, y = 0.00 m."],
"Your current program looked up laser_link in base_link and printed matching x/y": ["Votre programme actuel a lu laser_link dans base_link et affiché les valeurs x/y correspondantes","Je huidige programma heeft laser_link in base_link opgevraagd en de bijbehorende x/y afgedrukt","Tu programa actual consultó laser_link en base_link e imprimió los valores x/y correspondientes","Dein aktuelles Programm hat laser_link in base_link abgefragt und passende x/y ausgegeben","O teu programa atual consultou laser_link em base_link e imprimiu os valores x/y correspondentes","Il programma corrente ha letto laser_link in base_link e stampato i valori x/y corrispondenti"],
"Your current program expressed the odom target in base_link and printed matching x/y": ["Votre programme actuel a exprimé la cible odom dans base_link et affiché les valeurs x/y correspondantes","Je huidige programma heeft het odom-doel in base_link uitgedrukt en de bijbehorende x/y afgedrukt","Tu programa actual expresó el objetivo odom en base_link e imprimió los valores x/y correspondientes","Dein aktuelles Programm hat das odom-Ziel in base_link ausgedrückt und passende x/y ausgegeben","O teu programa atual expressou o alvo odom em base_link e imprimiu os valores x/y correspondentes","Il programma corrente ha espresso il bersaglio odom in base_link e stampato i valori x/y corrispondenti"],
 "TF & Odometry": ["TF et odométrie","TF en odometrie","TF y odometría","TF und Odometrie","TF e odometria","TF e odometria"],
 "Frames & TF": [
  "Repères et TF",
  "Frames en TF",
  "Marcos y TF",
  "Koordinatensysteme und TF",
  "Referenciais e TF",
  "Sistemi di riferimento e TF"
 ],
 "One robot. Several points of view.": [
  "Un robot. Plusieurs points de vue.",
  "Eén robot. Verschillende gezichtspunten.",
  "Un robot. Varios puntos de vista.",
  "Ein Roboter. Mehrere Blickwinkel.",
  "Um robô. Vários pontos de vista.",
  "Un robot. Diversi punti di vista."
 ],
 "Frame": [
  "Repère",
  "Frame",
  "Marco",
  "Koordinatensystem",
  "Referencial",
  "Sistema di riferimento"
 ],
 "Transform": [
  "Transformation",
  "Transformatie",
  "Transformación",
  "Transformation",
  "Transformação",
  "Trasformazione"
 ],
 "TF tree": [
  "Arbre TF",
  "TF-boom",
  "Árbol TF",
  "TF-Baum",
  "Árvore TF",
  "Albero TF"
 ],
 ": an origin and axes.": [
  ": une origine et des axes.",
  ": een oorsprong en assen.",
  ": un origen y unos ejes.",
  ": ein Ursprung und Achsen.",
  ": uma origem e eixos.",
  ": un’origine e degli assi."
 ],
 ": a relationship between frames.": [
  ": une relation entre repères.",
  ": een relatie tussen frames.",
  ": una relación entre marcos.",
  ": eine Beziehung zwischen Systemen.",
  ": uma relação entre referenciais.",
  ": una relazione tra sistemi."
 ],
 ": their connected hierarchy.": [
  ": leur hiérarchie connectée.",
  ": hun verbonden hiërarchie.",
  ": su jerarquía conectada.",
  ": ihre verbundene Hierarchie.",
  ": a sua hierarquia ligada.",
  ": la loro gerarchia collegata."
 ],
 "Spatial view": [
  "Vue spatiale",
  "Ruimtelijke weergave",
  "Vista espacial",
  "Räumliche Ansicht",
  "Vista espacial",
  "Vista spaziale"
 ],
 "Mount detail": [
  "Détail du support",
  "Bevestigingsdetail",
  "Detalle del soporte",
  "Halterungsdetail",
  "Detalhe do suporte",
  "Dettaglio del supporto"
 ],
 "Room view": [
  "Vue de la pièce",
  "Kamerweergave",
  "Vista de la sala",
  "Raumansicht",
  "Vista da sala",
  "Vista della stanza"
 ],
 "Transform inspector": [
  "Inspecteur de transformation",
  "Transformatie-inspecteur",
  "Inspector de transformación",
  "Transformationsinspektor",
  "Inspetor de transformação",
  "Ispettore della trasformazione"
 ],
 "Reference · target": [
  "Référence · cible",
  "Referentie · doel",
  "Referencia · destino",
  "Referenz · Ziel",
  "Referência · destino",
  "Riferimento · destinazione"
 ],
 "Frame · source": [
  "Repère · source",
  "Frame · bron",
  "Marco · origen",
  "System · Quelle",
  "Referencial · origem",
  "Sistema · sorgente"
 ],
 "static": [
  "statique",
  "statisch",
  "estático",
  "statisch",
  "estático",
  "statico"
 ],
 "dynamic": [
  "dynamique",
  "dynamisch",
  "dinámico",
  "dynamisch",
  "dinâmico",
  "dinamico"
 ],
 "root": [
  "racine",
  "wortel",
  "raíz",
  "Wurzel",
  "raiz",
  "radice"
 ],
 "Solid: dynamic · Dashed: static": [
  "Continu : dynamique · Tirets : statique",
  "Vol: dynamisch · Streepjes: statisch",
  "Continuo: dinámico · Discontinuo: estático",
  "Durchgezogen: dynamisch · Gestrichelt: statisch",
  "Contínuo: dinâmico · Tracejado: estático",
  "Continuo: dinamico · Tratteggiato: statico"
 ],
 "Top view ·": [
  "Vue de dessus ·",
  "Bovenaanzicht ·",
  "Vista superior ·",
  "Draufsicht ·",
  "Vista de cima ·",
  "Vista dall’alto ·"
 ],
 "x → red": [
  "x → rouge",
  "x → rood",
  "x → rojo",
  "x → rot",
  "x → vermelho",
  "x → rosso"
 ],
 "y → green": [
  "y → vert",
  "y → groen",
  "y → verde",
  "y → grün",
  "y → verde",
  "y → verde"
 ],
 "· metres": [
  "· mètres",
  "· meter",
  "· metros",
  "· Meter",
  "· metros",
  "· metri"
 ],
 "ROS message details": [
  "Détails du message ROS",
  "ROS-berichtdetails",
  "Detalles del mensaje ROS",
  "ROS-Nachrichtendetails",
  "Detalhes da mensagem ROS",
  "Dettagli del messaggio ROS"
 ],
 "ROS stores orientation as a quaternion. This lesson uses yaw for planar frames.": [
  "ROS stocke l’orientation sous forme de quaternion. Cette leçon utilise yaw pour les repères plans.",
  "ROS slaat oriëntatie op als quaternion. Deze les gebruikt yaw voor vlakke frames.",
  "ROS guarda la orientación como cuaternión. Esta lección usa yaw para marcos planos.",
  "ROS speichert die Orientierung als Quaternion. Diese Lektion verwendet yaw für ebene Systeme.",
  "ROS guarda a orientação num quaternião. Esta lição usa yaw para referenciais planos.",
  "ROS memorizza l’orientamento come quaternione. Questa lezione usa yaw per sistemi piani."
 ],
 "Yaw is the turn about the upward axis.": [
  "Yaw est la rotation autour de l’axe vertical.",
  "Yaw is de draaiing om de opwaartse as.",
  "Yaw es el giro alrededor del eje vertical.",
  "Yaw ist die Drehung um die nach oben gerichtete Achse.",
  "Yaw é a rotação em torno do eixo vertical.",
  "Yaw è la rotazione attorno all’asse verticale."
 ],
 "3D orientation": [
  "orientation 3D",
  "3D-oriëntatie",
  "orientación 3D",
  "3D-Orientierung",
  "orientação 3D",
  "orientamento 3D"
 ],
 "Optical/wheel axes leave this top view; projected axes may appear as a dot.": [
  "Les axes optiques/des roues sortent de ce plan ; leur projection peut être un point.",
  "Optische en wielassen verlaten dit vlak; hun projectie kan een punt zijn.",
  "Los ejes ópticos y de las ruedas salen de este plano; su proyección puede ser un punto.",
  "Optische und Radachsen verlassen diese Ebene; ihre Projektion kann ein Punkt sein.",
  "Os eixos óticos e das rodas saem deste plano; a projeção pode ser um ponto.",
  "Gli assi ottici e delle ruote escono da questo piano; la proiezione può essere un punto."
 ],
 "Start simulator": [
  "Démarrer le simulateur",
  "Simulator starten",
  "Iniciar simulador",
  "Simulator starten",
  "Iniciar simulador",
  "Avvia simulatore"
 ],
 "Move forward": [
  "Avancer",
  "Vooruit bewegen",
  "Avanzar",
  "Vorwärts fahren",
  "Avançar",
  "Avanza"
 ],
 "Turn left": [
  "Tourner à gauche",
  "Links draaien",
  "Girar a la izquierda",
  "Nach links drehen",
  "Virar à esquerda",
  "Gira a sinistra"
 ],
 "Stop motion": [
  "Arrêter le mouvement",
  "Beweging stoppen",
  "Detener movimiento",
  "Bewegung stoppen",
  "Parar movimento",
  "Ferma movimento"
 ],
 "Reset pose": [
  "Réinitialiser la pose",
  "Pose herstellen",
  "Restablecer pose",
  "Pose zurücksetzen",
  "Repor pose",
  "Ripristina posa"
 ],
 "Stop simulator": [
  "Arrêter le simulateur",
  "Simulator stoppen",
  "Detener simulador",
  "Simulator stoppen",
  "Parar simulador",
  "Ferma simulatore"
 ],
 "Movement lasts up to 2 seconds.": [
  "Le mouvement dure au maximum 2 secondes.",
  "De beweging duurt maximaal 2 seconden.",
  "El movimiento dura hasta 2 segundos.",
  "Die Bewegung dauert höchstens 2 Sekunden.",
  "O movimento dura até 2 segundos.",
  "Il movimento dura al massimo 2 secondi."
 ],
 "Simulator stopped · start to see live TF": [
  "Simulateur arrêté · démarrez pour voir TF",
  "Simulator gestopt · start om TF te zien",
  "Simulador detenido · inicia para ver TF",
  "Simulator gestoppt · für TF starten",
  "Simulador parado · inicia para ver TF",
  "Simulatore fermo · avvia per vedere TF"
 ],
 "Live TF · latest transforms": [
  "TF en direct · dernières transformations",
  "Live TF · nieuwste transformaties",
  "TF en vivo · últimas transformaciones",
  "Live-TF · neueste Transformationen",
  "TF em direto · transformações recentes",
  "TF in tempo reale · ultime trasformazioni"
 ],
 "Start the simulator to populate the tree.": [
  "Démarrez le simulateur pour remplir l’arbre.",
  "Start de simulator om de boom te vullen.",
  "Inicia el simulador para llenar el árbol.",
  "Starte den Simulator, um den Baum zu füllen.",
  "Inicia o simulador para preencher a árvore.",
  "Avvia il simulatore per popolare l’albero."
 ],
 "Start the simulator to see the frame tree.": [
  "Démarrez le simulateur pour voir l’arbre des repères.",
  "Start de simulator om de frameboom te zien.",
  "Inicia el simulador para ver el árbol de marcos.",
  "Starte den Simulator, um den Koordinatenbaum zu sehen.",
  "Inicia o simulador para ver a árvore de referenciais.",
  "Avvia il simulatore per vedere l’albero dei sistemi."
 ],
 "No transforms available.": [
  "Aucune transformation disponible.",
  "Geen transformaties beschikbaar.",
  "No hay transformaciones disponibles.",
  "Keine Transformationen verfügbar.",
  "Sem transformações disponíveis.",
  "Nessuna trasformazione disponibile."
 ],
 "Dynamic · robot pose": [
  "Dynamique · pose du robot",
  "Dynamisch · robotpose",
  "Dinámica · pose del robot",
  "Dynamisch · Roboterpose",
  "Dinâmica · pose do robô",
  "Dinamica · posa del robot"
 ],
 "Static · sensor mount": [
  "Statique · support du capteur",
  "Statisch · sensorbevestiging",
  "Estática · soporte del sensor",
  "Statisch · Sensorhalterung",
  "Estática · suporte do sensor",
  "Statica · supporto del sensore"
 ],
 "Waiting for simulator": [
  "En attente du simulateur",
  "Wachten op simulator",
  "Esperando al simulador",
  "Warte auf Simulator",
  "À espera do simulador",
  "In attesa del simulatore"
 ],
 "Same target · two coordinate descriptions": [
  "Même cible · deux descriptions des coordonnées",
  "Hetzelfde doel · twee coördinatenbeschrijvingen",
  "Mismo objetivo · dos descripciones de coordenadas",
  "Dasselbe Ziel · zwei Koordinatenbeschreibungen",
  "Mesmo alvo · duas descrições de coordenadas",
  "Stesso bersaglio · due descrizioni delle coordinate"
 ],
 "target": [
  "cible",
  "doel",
  "objetivo",
  "Ziel",
  "alvo",
  "bersaglio"
 ],
 "Think it through:": [
  "Réfléchissez :",
  "Denk erover na:",
  "Reflexiona:",
  "Denk darüber nach:",
  "Reflete:",
  "Rifletti:"
 ],
 "Pose of {frame} in {reference}.": [
  "Pose de {frame} dans {reference}.",
  "Pose van {frame} in {reference}.",
  "Pose de {frame} en {reference}.",
  "Pose von {frame} in {reference}.",
  "Pose de {frame} em {reference}.",
  "Posa di {frame} in {reference}."
 ],
 "1 square = {size} m · {view}": [
  "1 carré = {size} m · {view}",
  "1 vak = {size} m · {view}",
  "1 cuadrado = {size} m · {view}",
  "1 Quadrat = {size} m · {view}",
  "1 quadrado = {size} m · {view}",
  "1 quadrato = {size} m · {view}"
 ],
 "Check exercise": [
  "Vérifier l’exercice",
  "Oefening controleren",
  "Comprobar ejercicio",
  "Übung prüfen",
  "Verificar exercício",
  "Verifica esercizio"
 ],
 "TF exercise passed.": [
  "Exercice TF réussi.",
  "TF-oefening geslaagd.",
  "Ejercicio TF superado.",
  "TF-Übung bestanden.",
  "Exercício TF concluído.",
  "Esercizio TF superato."
 ],
 "Run your current program with the simulator, then check again.": [
  "Exécutez votre programme avec le simulateur, puis vérifiez à nouveau.",
  "Voer je huidige programma uit met de simulator en controleer opnieuw.",
  "Ejecuta tu programa con el simulador y comprueba de nuevo.",
  "Starte dein aktuelles Programm mit dem Simulator und prüfe erneut.",
  "Executa o programa atual com o simulador e verifica novamente.",
  "Esegui il programma attuale con il simulatore e verifica di nuovo."
 ],
 "Your current program looked up laser_link in base_link": [
  "Votre programme a recherché laser_link dans base_link",
  "Je huidige programma zocht laser_link op in base_link",
  "Tu programa consultó laser_link en base_link",
  "Dein Programm hat laser_link in base_link abgefragt",
  "O teu programa consultou laser_link em base_link",
  "Il tuo programma ha cercato laser_link in base_link"
 ],
 "Your current program expressed the odom target in base_link": [
  "Votre programme a exprimé la cible odom dans base_link",
  "Je huidige programma drukte het odom-doel uit in base_link",
  "Tu programa expresó el objetivo odom en base_link",
  "Dein Programm hat das odom-Ziel in base_link ausgedrückt",
  "O teu programa expressou o alvo odom em base_link",
  "Il tuo programma ha espresso il bersaglio odom in base_link"
 ],
 "Coordinates exceed the spatial view range.": [
  "Les coordonnées dépassent la plage de la vue spatiale.",
  "Coördinaten vallen buiten het bereik van de ruimtelijke weergave.",
  "Las coordenadas exceden el rango de la vista espacial.",
  "Die Koordinaten überschreiten den Bereich der räumlichen Ansicht.",
  "As coordenadas excedem o alcance da vista espacial.",
  "Le coordinate superano l’intervallo della vista spaziale."
 ],
 "Live coordinate frames": [
  "Repères en direct",
  "Live coördinatenframes",
  "Marcos en vivo",
  "Live-Koordinatensysteme",
  "Referenciais em direto",
  "Sistemi di riferimento in tempo reale"
 ],
 "Frame hierarchy": [
  "Hiérarchie des repères",
  "Framehiërarchie",
  "Jerarquía de marcos",
  "Koordinatenhierarchie",
  "Hierarquia de referenciais",
  "Gerarchia dei sistemi"
 ],
 "Top view of robot coordinate frames": [
  "Vue de dessus des repères du robot",
  "Bovenaanzicht van robotframes",
  "Vista superior de los marcos del robot",
  "Draufsicht der Roboterkoordinaten",
  "Vista de cima dos referenciais do robô",
  "Vista dall’alto dei sistemi del robot"
 ],
 "Compare dynamic and static transforms": [
  "Comparer transformations dynamiques et statiques",
  "Dynamische en statische transformaties vergelijken",
  "Comparar transformaciones dinámicas y estáticas",
  "Dynamische und statische Transformationen vergleichen",
  "Comparar transformações dinâmicas e estáticas",
  "Confronta trasformazioni dinamiche e statiche"
 ],
 "TF exercises": [
  "Exercices TF",
  "TF-oefeningen",
  "Ejercicios TF",
  "TF-Übungen",
  "Exercícios TF",
  "Esercizi TF"
 ],
 "Frames | one point, different coordinates": [
  "Repères | un point, plusieurs coordonnées",
  "Frames | één punt, andere coördinaten",
  "Marcos | un punto, distintas coordenadas",
  "Koordinatensysteme | ein Punkt, verschiedene Koordinaten",
  "Referenciais | um ponto, coordenadas diferentes",
  "Sistemi di riferimento | un punto, coordinate diverse"
 ],
 "A frame is a coordinate system with an origin and an orientation. A transform describes the relationship between two frames. A TF tree connects those relationships so ROS can express a point in another frame.": [
  "Un repère possède une origine et une orientation. Une transformation décrit la relation entre deux repères. L’arbre TF relie ces relations pour exprimer un point dans un autre repère.",
  "Een frame is een coördinatenstelsel met een oorsprong en oriëntatie. Een transformatie beschrijft de relatie tussen twee frames. De TF-boom verbindt die relaties zodat ROS een punt in een ander frame kan uitdrukken.",
  "Un marco es un sistema de coordenadas con origen y orientación. Una transformación relaciona dos marcos. El árbol TF conecta esas relaciones para expresar un punto en otro marco.",
  "Ein Koordinatensystem hat einen Ursprung und eine Orientierung. Eine Transformation beschreibt die Beziehung zwischen zwei Koordinatensystemen. Der TF-Baum verbindet diese Beziehungen, damit ROS einen Punkt in einem anderen System ausdrücken kann.",
  "Um referencial tem uma origem e uma orientação. Uma transformação descreve a relação entre dois referenciais. A árvore TF liga essas relações para expressar um ponto noutro referencial.",
  "Un sistema di riferimento ha un’origine e un orientamento. Una trasformazione descrive la relazione tra due sistemi. L’albero TF collega queste relazioni per esprimere un punto in un altro sistema."
 ],
 "Start the simulator in the TF view. Select odom, then base_link, then laser_link. The robot body uses base_link: +x points forward and +y points left. The laser has its own origin at its mount. Red axes show +x; green axes show +y. Labels and axis letters identify each frame too.": [
  "Démarrez le simulateur. Sélectionnez odom, base_link puis laser_link. Dans base_link, +x pointe vers l’avant et +y vers la gauche. Le laser a son origine sur son support. Les axes rouges indiquent +x, les verts +y. Les noms et lettres identifient aussi les repères.",
  "Start de simulator. Selecteer odom, base_link en laser_link. In base_link wijst +x vooruit en +y naar links. De laser heeft een eigen oorsprong op zijn bevestiging. Rode assen tonen +x, groene +y. Namen en asletters helpen de frames herkennen.",
  "Inicia el simulador. Selecciona odom, base_link y laser_link. En base_link, +x apunta hacia delante y +y hacia la izquierda. El origen del láser está en su soporte. Los ejes rojos indican +x y los verdes +y; los nombres y letras también identifican los marcos.",
  "Starte den Simulator. Wähle odom, base_link und laser_link. In base_link zeigt +x nach vorne und +y nach links. Der Laser hat seinen Ursprung an der Halterung. Rote Achsen zeigen +x, grüne +y. Namen und Achsenbuchstaben kennzeichnen die Systeme ebenfalls.",
  "Inicia o simulador. Seleciona odom, base_link e laser_link. Em base_link, +x aponta para a frente e +y para a esquerda. A origem do laser fica no seu suporte. Os eixos vermelhos indicam +x e os verdes +y; os nomes e letras também identificam os referenciais.",
  "Avvia il simulatore. Seleziona odom, base_link e laser_link. In base_link, +x punta avanti e +y a sinistra. Il laser ha la propria origine sul supporto. Gli assi rossi indicano +x, quelli verdi +y; nomi e lettere identificano anche i sistemi."
 ],
 "odom stays fixed in this simulated room; base_link moves with the robot. Robots use several frames because measurements belong to sensors while movement is described relative to the robot or its surroundings. The same physical point can have different coordinates in each frame.": [
  "odom reste fixe dans cette pièce simulée ; base_link suit le robot. Plusieurs repères permettent de décrire les mesures des capteurs et le mouvement par rapport au robot ou à son environnement. Un même point physique peut avoir des coordonnées différentes dans chaque repère.",
  "odom blijft vast in deze gesimuleerde kamer; base_link beweegt met de robot. Sensoren meten in hun eigen frame, terwijl beweging ten opzichte van de robot of omgeving wordt beschreven. Hetzelfde fysieke punt kan dus andere coördinaten hebben in elk frame.",
  "odom permanece fijo en esta sala simulada; base_link se mueve con el robot. Las medidas pertenecen a los sensores, mientras el movimiento se describe respecto al robot o al entorno. Un mismo punto físico puede tener coordenadas distintas en cada marco.",
  "odom bleibt in diesem simulierten Raum fest; base_link bewegt sich mit dem Roboter. Sensoren messen in ihren eigenen Systemen, während Bewegung relativ zum Roboter oder zur Umgebung beschrieben wird. Derselbe Punkt kann in jedem System andere Koordinaten haben.",
  "odom fica fixo nesta sala simulada; base_link acompanha o robô. As medições pertencem aos sensores, enquanto o movimento é descrito em relação ao robô ou ao ambiente. O mesmo ponto físico pode ter coordenadas diferentes em cada referencial.",
  "odom resta fisso nella stanza simulata; base_link segue il robot. Le misure appartengono ai sensori, mentre il movimento è descritto rispetto al robot o all’ambiente. Lo stesso punto fisico può avere coordinate diverse in ogni sistema."
 ],
 "Both TF topics carry tf2_msgs/msg/TFMessage, a list of TransformStamped messages. --once prints one sample and returns to the prompt. Read header.frame_id as the parent and child_frame_id as the child.": [
  "Les deux topics TF transportent tf2_msgs/msg/TFMessage, une liste de TransformStamped. --once affiche un échantillon puis rend la main. header.frame_id désigne le parent et child_frame_id l’enfant.",
  "Beide TF-topics dragen tf2_msgs/msg/TFMessage: een lijst TransformStamped-berichten. --once toont één bericht en keert terug naar de prompt. header.frame_id is de ouder; child_frame_id is het kind.",
  "Ambos topics TF llevan tf2_msgs/msg/TFMessage, una lista de TransformStamped. --once muestra una muestra y vuelve al prompt. header.frame_id indica el padre y child_frame_id el hijo.",
  "Beide TF-Topics übertragen tf2_msgs/msg/TFMessage, eine Liste von TransformStamped-Nachrichten. --once zeigt eine Nachricht und kehrt zur Eingabe zurück. header.frame_id bezeichnet den Elternknoten, child_frame_id den Kindknoten.",
  "Ambos os tópicos TF transportam tf2_msgs/msg/TFMessage, uma lista de TransformStamped. --once mostra uma amostra e volta ao prompt. header.frame_id indica o pai e child_frame_id o filho.",
  "Entrambi i topic TF trasportano tf2_msgs/msg/TFMessage, una lista di TransformStamped. --once mostra un campione e torna al prompt. header.frame_id indica il padre e child_frame_id il figlio."
 ],
 "Which frame stays fixed when the robot moves? Which frames travel with it?": [
  "Quel repère reste fixe quand le robot bouge ? Lesquels le suivent ?",
  "Welk frame blijft vast als de robot beweegt? Welke bewegen mee?",
  "¿Qué marco queda fijo al moverse el robot? ¿Cuáles lo acompañan?",
  "Welches System bleibt beim Bewegen des Roboters fest? Welche bewegen sich mit?",
  "Que referencial fica fixo quando o robô se move? Quais o acompanham?",
  "Quale sistema resta fisso quando il robot si muove? Quali lo seguono?"
 ],
 "odom stays fixed here. base_link, laser_link, camera_link, camera_optical_frame and both wheel frames travel with the robot. A frame is a coordinate system; it is not a topic or a ROS node.": [
  "odom reste fixe ici. base_link, laser_link, camera_link, camera_optical_frame et les deux repères des roues suivent le robot. Un repère est un système de coordonnées, pas un topic ni un nœud ROS.",
  "odom blijft hier vast. base_link, laser_link, camera_link, camera_optical_frame en beide wielframes bewegen mee. Een frame is een coördinatenstelsel, geen topic of ROS-node.",
  "Aquí odom queda fijo. base_link, laser_link, camera_link, camera_optical_frame y los marcos de ambas ruedas acompañan al robot. Un marco es un sistema de coordenadas, no un topic ni un nodo ROS.",
  "odom bleibt hier fest. base_link, laser_link, camera_link, camera_optical_frame und beide Radsysteme bewegen sich mit. Ein Koordinatensystem ist weder ein Topic noch ein ROS-Knoten.",
  "Aqui odom fica fixo. base_link, laser_link, camera_link, camera_optical_frame e os referenciais das rodas acompanham o robô. Um referencial é um sistema de coordenadas, não um tópico nem um nó ROS.",
  "Qui odom resta fisso. base_link, laser_link, camera_link, camera_optical_frame e i sistemi delle ruote seguono il robot. Un sistema di riferimento non è un topic né un nodo ROS."
 ],
 "Tree | fixed mounts, moving robot": [
  "Arbre | supports fixes, robot mobile",
  "Boom | vaste bevestigingen, bewegende robot",
  "Árbol | soportes fijos, robot móvil",
  "Baum | feste Halterungen, bewegter Roboter",
  "Árvore | suportes fixos, robô em movimento",
  "Albero | supporti fissi, robot in movimento"
 ],
 "Select odom → base_link in the tree. Use Move forward, then Turn left, and watch the moving relationship beside the fixed laser mount. The robot position and heading change in odom. base_link → laser_link stays x = 0.12 m, y = 0.00 m, yaw = 0.00 rad because the sensor is bolted to the body. Use Stop motion to stop.": [
  "Sélectionnez odom → base_link. Avancez, puis tournez à gauche : la position et le cap changent dans odom. Comparez avec base_link → laser_link, qui reste à x = 0.12 m, y = 0.00 m, yaw = 0.00 rad, car le capteur est fixé au châssis. Arrêtez le mouvement avec le bouton prévu.",
  "Selecteer odom → base_link. Beweeg vooruit en draai links: positie en richting veranderen in odom. Vergelijk met base_link → laser_link: x = 0.12 m, y = 0.00 m, yaw = 0.00 rad blijven gelijk omdat de sensor vastzit aan de robot. Gebruik Beweging stoppen om te stoppen.",
  "Selecciona odom → base_link. Avanza y gira a la izquierda: la posición y orientación cambian en odom. Compara con base_link → laser_link: x = 0.12 m, y = 0.00 m, yaw = 0.00 rad no cambian porque el sensor está fijado al cuerpo. Usa Detener movimiento para parar.",
  "Wähle odom → base_link. Fahre vorwärts und drehe nach links: Position und Richtung ändern sich in odom. Bei base_link → laser_link bleiben x = 0.12 m, y = 0.00 m, yaw = 0.00 rad gleich, weil der Sensor fest montiert ist. Halte mit Bewegung stoppen an.",
  "Seleciona odom → base_link. Avança e vira à esquerda: a posição e orientação mudam em odom. Em base_link → laser_link, x = 0.12 m, y = 0.00 m, yaw = 0.00 rad ficam constantes porque o sensor está fixo ao corpo. Usa Parar movimento para parar.",
  "Seleziona odom → base_link. Avanza e gira a sinistra: posizione e direzione cambiano in odom. In base_link → laser_link, x = 0.12 m, y = 0.00 m, yaw = 0.00 rad restano costanti perché il sensore è fissato al corpo. Usa Ferma movimento per fermarti."
 ],
 "A static transform stays constant: the laser mount, camera mount and camera optical frame. A dynamic transform can change: odom → base_link and the wheels. The wheel centres stay at their mounts, but the wheels roll, so their orientation changes. The tree labels these edges static or dynamic.": [
  "Une transformation statique reste constante : supports du laser, de la caméra et repère optique. Une transformation dynamique peut changer : odom → base_link et les roues. Le centre des roues reste fixé, mais leur orientation change quand elles roulent. L’arbre distingue les liens statiques et dynamiques.",
  "Een statische transformatie blijft gelijk: de laserbevestiging, camerabevestiging en het optische frame. Dynamische transformaties kunnen veranderen: odom → base_link en de wielen. De wielcentra blijven op hun bevestiging, maar de oriëntatie verandert door het rollen. De boom toont dit onderscheid.",
  "Una transformación estática permanece constante: soportes del láser y cámara y marco óptico. Una dinámica puede cambiar: odom → base_link y las ruedas. Sus centros permanecen en los soportes, pero su orientación cambia al rodar. El árbol indica enlaces estáticos y dinámicos.",
  "Eine statische Transformation bleibt konstant: Laserhalterung, Kamerahalterung und optisches System. Dynamische Transformationen können sich ändern: odom → base_link und die Räder. Die Radmittelpunkte bleiben fest montiert, aber ihre Orientierung ändert sich beim Rollen. Der Baum kennzeichnet beide Arten.",
  "Uma transformação estática fica constante: suportes do laser e câmara e referencial ótico. Uma dinâmica pode mudar: odom → base_link e as rodas. Os centros das rodas ficam nos suportes, mas a orientação muda ao rodarem. A árvore distingue ligações estáticas e dinâmicas.",
  "Una trasformazione statica resta costante: supporti del laser e della camera e sistema ottico. Una dinamica può cambiare: odom → base_link e le ruote. I centri delle ruote restano fissati, ma l’orientamento cambia quando rotolano. L’albero distingue i due tipi."
 ],
 "This command asks for the retained static sample, even after its original publication. /tf carries changing relationships; /tf_static carries fixed relationships. A chain through the tree connects laser_link to odom through base_link. The inspector emphasizes x, y and yaw; ROS message details shows the quaternion fields ROS uses for orientation.": [
  "Cette commande demande l’échantillon statique conservé après sa publication. /tf porte les relations variables ; /tf_static les relations fixes. L’arbre relie laser_link à odom via base_link. L’inspecteur montre x, y et yaw ; les détails ROS affichent les champs du quaternion d’orientation.",
  "Deze opdracht vraagt het bewaarde statische bericht op, ook na publicatie. /tf draagt veranderende relaties; /tf_static vaste relaties. De boom verbindt laser_link via base_link met odom. De inspecteur toont x, y en yaw; ROS-berichtdetails tonen de quaternionvelden voor oriëntatie.",
  "Este comando pide la muestra estática retenida tras publicarse. /tf contiene relaciones cambiantes; /tf_static relaciones fijas. El árbol conecta laser_link con odom mediante base_link. El inspector muestra x, y y yaw; los detalles ROS muestran los campos del cuaternión de orientación.",
  "Dieser Befehl fragt die gespeicherte statische Nachricht nach ihrer Veröffentlichung ab. /tf enthält veränderliche, /tf_static feste Beziehungen. Der Baum verbindet laser_link über base_link mit odom. Der Inspektor zeigt x, y und yaw; die ROS-Details zeigen die Quaternion-Felder der Orientierung.",
  "Este comando pede a amostra estática retida após a publicação. /tf transporta relações variáveis; /tf_static relações fixas. A árvore liga laser_link a odom por base_link. O inspetor mostra x, y e yaw; os detalhes ROS mostram os campos do quaternião da orientação.",
  "Questo comando richiede il campione statico conservato dopo la pubblicazione. /tf contiene relazioni variabili; /tf_static relazioni fisse. L’albero collega laser_link a odom tramite base_link. L’ispettore mostra x, y e yaw; i dettagli ROS mostrano i campi del quaternione di orientamento."
 ],
 "Does a static laser transform mean the laser stays still in the room?": [
  "Une transformation laser statique signifie-t-elle que le laser reste immobile dans la pièce ?",
  "Betekent een statische lasertransformatie dat de laser stilstaat in de kamer?",
  "¿Una transformación estática del láser significa que no se mueve en la sala?",
  "Bedeutet eine statische Lasertransformation, dass der Laser im Raum stillsteht?",
  "Uma transformação estática do laser significa que fica imóvel na sala?",
  "Una trasformazione statica del laser significa che resta fermo nella stanza?"
 ],
 "No. laser_link stays fixed relative to base_link, and both move relative to odom. “Static” describes a relationship between frames. Select odom → laser_link to see that combined relationship change.": [
  "Non. laser_link reste fixe par rapport à base_link ; tous deux bougent par rapport à odom. « Statique » décrit une relation entre repères. Sélectionnez odom → laser_link pour voir la relation composée changer.",
  "Nee. laser_link blijft vast ten opzichte van base_link; beide bewegen ten opzichte van odom. Statisch beschrijft een relatie tussen frames. Selecteer odom → laser_link om de samengestelde relatie te zien veranderen.",
  "No. laser_link queda fijo respecto a base_link, y ambos se mueven respecto a odom. Estática describe una relación entre marcos. Selecciona odom → laser_link para ver cambiar la relación compuesta.",
  "Nein. laser_link bleibt relativ zu base_link fest; beide bewegen sich relativ zu odom. Statisch beschreibt eine Beziehung zwischen Systemen. Wähle odom → laser_link, um die zusammengesetzte Beziehung zu sehen.",
  "Não. laser_link fica fixo em relação a base_link; ambos movem-se em relação a odom. Estática descreve uma relação entre referenciais. Seleciona odom → laser_link para observar a relação composta.",
  "No. laser_link resta fisso rispetto a base_link; entrambi si muovono rispetto a odom. Statica descrive una relazione tra sistemi. Seleziona odom → laser_link per vedere cambiare la relazione composta."
 ],
 "Lookup | ask TF from your code": [
  "Recherche | interroger TF depuis le code",
  "Opzoeken | vraag TF vanuit je code",
  "Consulta | usa TF desde tu código",
  "Abfragen | TF im Code verwenden",
  "Consulta | usar TF no código",
  "Ricerca | usare TF dal codice"
 ],
 "Prepare this unit to create the small tf_lab package and starter files. Keep the simulator running. The listener receives TF into a Buffer; a timer lets incoming transforms arrive before each lookup. This program prints twice per second. Ctrl+C or Stop ends it.": [
  "Préparez cette unité pour créer tf_lab et les fichiers de départ. Gardez le simulateur actif. Le listener reçoit TF dans un Buffer ; un timer laisse arriver les transformations avant chaque recherche. Le programme affiche deux fois par seconde. Ctrl+C ou Arrêter le termine.",
  "Bereid deze eenheid voor om tf_lab en de startbestanden te maken. Laat de simulator draaien. De listener ontvangt TF in een Buffer; een timer laat transformaties aankomen vóór het opzoeken. Het programma print tweemaal per seconde. Ctrl+C of Stop beëindigt het.",
  "Prepara esta unidad para crear tf_lab y los archivos iniciales. Mantén el simulador activo. El listener recibe TF en un Buffer; un temporizador permite recibir las transformaciones antes de consultarlas. El programa imprime dos veces por segundo. Ctrl+C o Detener lo termina.",
  "Bereite diese Einheit vor, um tf_lab und die Startdateien anzulegen. Lass den Simulator laufen. Der Listener empfängt TF in einem Buffer; ein Timer lässt Transformationen vor der Abfrage eintreffen. Das Programm gibt zweimal pro Sekunde Werte aus. Ctrl+C oder Stop beendet es.",
  "Prepara esta unidade para criar tf_lab e os ficheiros iniciais. Mantém o simulador ativo. O listener recebe TF num Buffer; um temporizador permite receber transformações antes da consulta. O programa imprime duas vezes por segundo. Ctrl+C ou Parar termina-o.",
  "Prepara questa unità per creare tf_lab e i file iniziali. Lascia attivo il simulatore. Il listener riceve TF in un Buffer; un timer lascia arrivare le trasformazioni prima della ricerca. Il programma stampa due volte al secondo. Ctrl+C o Stop lo termina."
 ],
 "lookup_transform('base_link', 'laser_link', Time()) asks for laser_link expressed in base_link: target frame first, source frame second. Time() requests the latest available transform.": [
  "lookup_transform('base_link', 'laser_link', Time()) exprime laser_link dans base_link : repère cible d’abord, repère source ensuite. Time() demande la dernière transformation disponible.",
  "lookup_transform('base_link', 'laser_link', Time()) drukt laser_link uit in base_link: doelframe eerst, bronframe daarna. Time() vraagt de laatst beschikbare transformatie.",
  "lookup_transform('base_link', 'laser_link', Time()) expresa laser_link en base_link: primero el marco destino, luego el origen. Time() pide la última transformación disponible.",
  "lookup_transform('base_link', 'laser_link', Time()) drückt laser_link in base_link aus: Zielsystem zuerst, Quellsystem danach. Time() fordert die neueste verfügbare Transformation an.",
  "lookup_transform('base_link', 'laser_link', Time()) expressa laser_link em base_link: primeiro o referencial de destino, depois o de origem. Time() pede a transformação mais recente.",
  "lookup_transform('base_link', 'laser_link', Time()) esprime laser_link in base_link: prima il sistema destinazione, poi quello sorgente. Time() richiede l’ultima trasformazione disponibile."
 ],
 "Run the starter unchanged once. It deliberately asks for laser, which is not a frame in this tree. Expect a clear TF lookup failure. Stop the program. Inspect the tree and change laser to laser_link. Save, rebuild, source and run again using the commands below. Expect x = 0.12, y = 0.00 m.": [
  "Exécutez une fois le code initial sans le modifier. Il demande volontairement laser, absent de l’arbre : une erreur TF est attendue. Arrêtez le programme. Consultez l’arbre et remplacez laser par laser_link. Enregistrez, reconstruisez, sourcez l’environnement et relancez avec les commandes ci-dessous. Résultat attendu : x = 0.12, y = 0.00 m.",
  "Voer de starter eerst ongewijzigd uit. Die vraagt bewust naar laser, dat niet in de boom staat: verwacht een TF-fout. Stop het programma. Bekijk de boom en vervang laser door laser_link. Sla op, bouw opnieuw, source de omgeving en voer opnieuw uit met de opdrachten hieronder. Verwacht x = 0.12, y = 0.00 m.",
  "Ejecuta una vez el código inicial sin cambios. Pide laser deliberadamente, un marco que no existe: espera un error TF. Detén el programa. Revisa el árbol y cambia laser por laser_link. Guarda, recompila, carga el entorno y vuelve a ejecutar los comandos de abajo. Espera x = 0.12, y = 0.00 m.",
  "Führe den Startcode einmal unverändert aus. Er fragt absichtlich nach laser, das im Baum fehlt: Ein TF-Fehler wird erwartet. Stoppe das Programm. Prüfe den Baum und ersetze laser durch laser_link. Speichere, baue erneut, lade die Umgebung mit source und starte mit den Befehlen unten. Erwartet: x = 0.12, y = 0.00 m.",
  "Executa o código inicial uma vez sem alterações. Pede laser de propósito, um referencial inexistente: espera um erro TF. Para o programa. Consulta a árvore e muda laser para laser_link. Guarda, recompila, carrega o ambiente e volta a executar com os comandos abaixo. Espera x = 0.12, y = 0.00 m.",
  "Esegui una volta il codice iniziale senza modificarlo. Richiede apposta laser, assente nell’albero: è previsto un errore TF. Ferma il programma. Controlla l’albero e cambia laser in laser_link. Salva, ricompila, carica l’ambiente ed esegui di nuovo con i comandi sotto. Risultato atteso: x = 0.12, y = 0.00 m."
 ],
 "The result is a TransformStamped. transform.translation.x and .y locate the laser origin in base_link. Reading the live transform is the task; printing copied numbers does not pass. Frame names must match the TF tree.": [
  "Le résultat est un TransformStamped. transform.translation.x et .y placent l’origine du laser dans base_link. Il faut lire la transformation réelle : afficher des nombres copiés ne suffit pas. Les noms des repères doivent correspondre à l’arbre TF.",
  "Het resultaat is een TransformStamped. transform.translation.x en .y geven de laseroorsprong in base_link. Lees de echte transformatie; gekopieerde getallen afdrukken volstaat niet. Framenamen moeten overeenkomen met de TF-boom.",
  "El resultado es un TransformStamped. transform.translation.x y .y sitúan el origen del láser en base_link. Debes leer la transformación real; imprimir números copiados no basta. Los nombres deben coincidir con el árbol TF.",
  "Das Ergebnis ist ein TransformStamped. transform.translation.x und .y geben den Laserursprung in base_link an. Lies die aktuelle Transformation; kopierte Zahlen auszugeben reicht nicht. Die Namen müssen zum TF-Baum passen.",
  "O resultado é um TransformStamped. transform.translation.x e .y localizam a origem do laser em base_link. É preciso ler a transformação real; imprimir números copiados não basta. Os nomes têm de corresponder à árvore TF.",
  "Il risultato è un TransformStamped. transform.translation.x e .y localizzano l’origine del laser in base_link. Devi leggere la trasformazione reale; stampare numeri copiati non basta. I nomi devono corrispondere all’albero TF."
 ],
 "Apply | the target from the robot": [
  "Application | la cible vue du robot",
  "Toepassen | het doel vanuit de robot",
  "Aplicación | el objetivo desde el robot",
  "Anwenden | das Ziel aus Robotersicht",
  "Aplicação | o alvo visto pelo robô",
  "Applicazione | il bersaglio dal robot"
 ],
 "The marked target stays at x = 1.00 m, y = 1.00 m in odom. Move the robot in the TF view and watch the arrow from base_link to the same point. Its coordinates relative to the robot change while the physical target stays put.": [
  "La cible reste à x = 1.00 m, y = 1.00 m dans odom. Déplacez le robot et observez la flèche de base_link vers ce même point. Ses coordonnées relatives au robot changent alors que la cible physique reste fixe.",
  "Het doel blijft op x = 1.00 m, y = 1.00 m in odom. Beweeg de robot en bekijk de pijl van base_link naar hetzelfde punt. De coördinaten ten opzichte van de robot veranderen terwijl het fysieke doel blijft staan.",
  "El objetivo queda en x = 1.00 m, y = 1.00 m en odom. Mueve el robot y observa la flecha desde base_link al mismo punto. Sus coordenadas relativas al robot cambian aunque el objetivo físico permanezca fijo.",
  "Das Ziel bleibt bei x = 1.00 m, y = 1.00 m in odom. Bewege den Roboter und beobachte den Pfeil von base_link zum selben Punkt. Die Koordinaten relativ zum Roboter ändern sich, während das Ziel fest bleibt.",
  "O alvo fica em x = 1.00 m, y = 1.00 m em odom. Move o robô e observa a seta de base_link para o mesmo ponto. As coordenadas relativas ao robô mudam, mas o alvo físico fica fixo.",
  "Il bersaglio resta a x = 1.00 m, y = 1.00 m in odom. Muovi il robot e osserva la freccia da base_link allo stesso punto. Le coordinate relative al robot cambiano mentre il bersaglio fisico resta fermo."
 ],
 "Stop the lookup program. Open the point starter: it already creates a PointStamped with header.frame_id = odom and the target coordinates. Complete the TODO: use the Buffer to express that point in base_link, then print the resulting point.x and point.y. The zero timestamp requests the latest available transform.": [
  "Arrêtez le programme de recherche. Ouvrez le fichier initial du point : il crée déjà un PointStamped avec header.frame_id = odom et les coordonnées de la cible. Complétez le TODO : utilisez le Buffer pour exprimer ce point dans base_link, puis affichez point.x et point.y du résultat. L’horodatage nul demande la dernière transformation.",
  "Stop het opzoekprogramma. Open de puntstarter: die maakt al een PointStamped met header.frame_id = odom en de doelcoördinaten. Vul de TODO aan: gebruik de Buffer om dit punt in base_link uit te drukken en print point.x en point.y van het resultaat. Tijdstempel nul vraagt de nieuwste transformatie.",
  "Detén el programa de consulta. Abre el archivo inicial del punto: ya crea un PointStamped con header.frame_id = odom y las coordenadas del objetivo. Completa el TODO: usa el Buffer para expresar el punto en base_link e imprime point.x y point.y del resultado. El sello temporal cero pide la última transformación.",
  "Stoppe das Abfrageprogramm. Öffne die Punkt-Startdatei: Sie erzeugt bereits einen PointStamped mit header.frame_id = odom und den Zielkoordinaten. Ergänze das TODO: Drücke den Punkt mit dem Buffer in base_link aus und gib point.x und point.y des Ergebnisses aus. Zeitstempel null fordert die neueste Transformation an.",
  "Para o programa de consulta. Abre o ficheiro inicial do ponto: já cria um PointStamped com header.frame_id = odom e as coordenadas do alvo. Completa o TODO: usa o Buffer para expressar o ponto em base_link e imprime point.x e point.y do resultado. O instante zero pede a transformação mais recente.",
  "Ferma il programma di ricerca. Apri il file iniziale del punto: crea già un PointStamped con header.frame_id = odom e le coordinate del bersaglio. Completa il TODO: usa il Buffer per esprimere il punto in base_link e stampa point.x e point.y del risultato. Il timestamp zero richiede l’ultima trasformazione."
 ],
 "Use self.buffer.transform(target, 'base_link'). Importing tf2_geometry_msgs registers PointStamped so the Buffer knows how to transform it.": [
  "Utilisez self.buffer.transform(target, 'base_link'). L’import de tf2_geometry_msgs enregistre PointStamped pour que le Buffer sache le transformer.",
  "Gebruik self.buffer.transform(target, 'base_link'). Het importeren van tf2_geometry_msgs registreert PointStamped zodat de Buffer het kan transformeren.",
  "Usa self.buffer.transform(target, 'base_link'). Importar tf2_geometry_msgs registra PointStamped para que el Buffer pueda transformarlo.",
  "Verwende self.buffer.transform(target, 'base_link'). Der Import von tf2_geometry_msgs registriert PointStamped, damit der Buffer ihn transformieren kann.",
  "Usa self.buffer.transform(target, 'base_link'). Importar tf2_geometry_msgs regista PointStamped para o Buffer o poder transformar.",
  "Usa self.buffer.transform(target, 'base_link'). L’importazione di tf2_geometry_msgs registra PointStamped affinché il Buffer possa trasformarlo."
 ],
 "Compare the printed x/y with the target’s base_link coordinates in the view. Reset pose gives (1.00, 1.00); move again and both readings change together. Positive x means ahead of the robot; positive y means to its left. TF handles the translation and rotation for you. No driving algorithm is needed.": [
  "Comparez les x/y affichés avec les coordonnées de la cible dans base_link. Réinitialiser la pose donne (1.00, 1.00) ; un nouveau mouvement fait varier les deux lectures ensemble. +x signifie devant le robot et +y à sa gauche. TF gère translation et rotation, sans algorithme de pilotage.",
  "Vergelijk de afgedrukte x/y met de doelcoördinaten in base_link. Pose herstellen geeft (1.00, 1.00); beweeg opnieuw en beide waarden veranderen samen. Positieve x is vooruit, positieve y is links van de robot. TF verwerkt verplaatsing en rotatie; er is geen rijalgoritme nodig.",
  "Compara los x/y impresos con las coordenadas del objetivo en base_link. Restablecer pose da (1.00, 1.00); al moverte, ambas lecturas cambian juntas. x positivo es delante del robot; y positivo es a su izquierda. TF resuelve traslación y rotación sin algoritmo de conducción.",
  "Vergleiche die ausgegebenen x/y-Werte mit den Zielkoordinaten in base_link. Pose zurücksetzen ergibt (1.00, 1.00); bei Bewegung ändern sich beide Anzeigen gemeinsam. Positives x liegt vor dem Roboter, positives y links davon. TF übernimmt Verschiebung und Drehung; ein Fahrregler ist nicht nötig.",
  "Compara os x/y impressos com as coordenadas do alvo em base_link. Repor pose dá (1.00, 1.00); ao mover, ambas as leituras mudam juntas. x positivo fica à frente do robô; y positivo à esquerda. TF trata a translação e rotação, sem algoritmo de condução.",
  "Confronta gli x/y stampati con le coordinate del bersaglio in base_link. Ripristina posa dà (1.00, 1.00); muovendoti, entrambe le letture cambiano insieme. x positivo è davanti al robot, y positivo alla sua sinistra. TF gestisce traslazione e rotazione senza algoritmi di guida."
 ],
 "Why transform a measurement or target into another frame?": [
  "Pourquoi exprimer une mesure ou une cible dans un autre repère ?",
  "Waarom een meting of doel naar een ander frame transformeren?",
  "¿Por qué expresar una medida u objetivo en otro marco?",
  "Warum eine Messung oder ein Ziel in ein anderes System transformieren?",
  "Porquê transformar uma medição ou alvo para outro referencial?",
  "Perché trasformare una misura o un bersaglio in un altro sistema?"
 ],
 "It lets values described by different coordinate systems be compared. Here TF expresses a room target relative to the robot; the same idea lets a robot interpret a sensor measurement relative to its body.": [
  "Cela permet de comparer des valeurs décrites dans des systèmes de coordonnées différents. Ici TF exprime une cible de la pièce par rapport au robot ; le même principe permet d’interpréter une mesure de capteur par rapport au châssis.",
  "Zo kun je waarden uit verschillende coördinatenstelsels vergelijken. Hier drukt TF een doel in de kamer uit ten opzichte van de robot. Hetzelfde principe helpt een sensormeting ten opzichte van het robotlichaam te begrijpen.",
  "Permite comparar valores descritos en sistemas de coordenadas diferentes. Aquí TF expresa un objetivo de la sala respecto al robot; la misma idea permite interpretar una medida de sensor respecto al cuerpo.",
  "So lassen sich Werte aus verschiedenen Koordinatensystemen vergleichen. Hier drückt TF ein Ziel im Raum relativ zum Roboter aus. Dasselbe Prinzip hilft, Sensormessungen relativ zum Roboterkörper zu verstehen.",
  "Permite comparar valores descritos em sistemas de coordenadas diferentes. Aqui TF expressa um alvo da sala em relação ao robô; a mesma ideia permite interpretar uma medição de sensor em relação ao corpo.",
  "Permette di confrontare valori descritti in sistemi di coordinate diversi. Qui TF esprime un bersaglio della stanza rispetto al robot; la stessa idea permette di interpretare una misura del sensore rispetto al corpo."
 ],
 "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) asks for laser_link expressed in base_link: target frame first, source frame second. TimePointZero requests the latest available transform.": [
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) exprime laser_link dans base_link : repère cible d’abord, repère source ensuite. TimePointZero demande la dernière transformation disponible.",
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) drukt laser_link uit in base_link: doelframe eerst, bronframe daarna. TimePointZero vraagt de nieuwste transformatie.",
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) expresa laser_link en base_link: primero el marco destino, luego el origen. TimePointZero pide la última transformación.",
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) drückt laser_link in base_link aus: Zielsystem zuerst, Quellsystem danach. TimePointZero fordert die neueste Transformation an.",
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) expressa laser_link em base_link: primeiro o referencial de destino, depois o de origem. TimePointZero pede a transformação mais recente.",
  "lookupTransform(\"base_link\", \"laser_link\", tf2::TimePointZero) esprime laser_link in base_link: prima il sistema destinazione, poi quello sorgente. TimePointZero richiede l’ultima trasformazione."
 ],
 "Run the starter unchanged once. It deliberately asks for laser, which is not a frame in this tree. Expect a clear TF lookup failure. This uncaught error ends the C++ program. Inspect the tree and change laser to laser_link. Save, rebuild, source and run again using the commands below. Expect x = 0.12, y = 0.00 m.": [
  "Exécutez une fois le code initial sans le modifier. Il demande volontairement laser, absent de l’arbre. Cette erreur TF non interceptée termine le programme C++. Consultez l’arbre et remplacez laser par laser_link. Enregistrez, reconstruisez, sourcez l’environnement et relancez avec les commandes ci-dessous. Résultat attendu : x = 0.12, y = 0.00 m.",
  "Voer de starter eerst ongewijzigd uit. Die vraagt bewust naar laser, dat niet in de boom staat. Deze niet-opgevangen TF-fout beëindigt het C++-programma. Bekijk de boom en vervang laser door laser_link. Sla op, bouw opnieuw, source de omgeving en voer opnieuw uit. Verwacht x = 0.12, y = 0.00 m.",
  "Ejecuta el código inicial sin cambios una vez. Pide laser deliberadamente, ausente del árbol. Este error TF no capturado termina el programa C++. Revisa el árbol y cambia laser por laser_link. Guarda, recompila, carga el entorno y ejecuta los comandos de abajo. Espera x = 0.12, y = 0.00 m.",
  "Führe den Startcode einmal unverändert aus. Er fragt absichtlich nach laser, das im Baum fehlt. Dieser unbehandelte TF-Fehler beendet das C++-Programm. Prüfe den Baum und ersetze laser durch laser_link. Speichere, baue erneut, lade die Umgebung mit source und starte erneut. Erwartet: x = 0.12, y = 0.00 m.",
  "Executa o código inicial uma vez sem alterações. Pede laser de propósito, ausente da árvore. Este erro TF não tratado termina o programa C++. Consulta a árvore e muda laser para laser_link. Guarda, recompila, carrega o ambiente e executa os comandos abaixo. Espera x = 0.12, y = 0.00 m.",
  "Esegui una volta il codice iniziale senza modificarlo. Richiede apposta laser, assente nell’albero. Questo errore TF non gestito termina il programma C++. Controlla l’albero e cambia laser in laser_link. Salva, ricompila, carica l’ambiente ed esegui i comandi sotto. Risultato atteso: x = 0.12, y = 0.00 m."
 ],
 "Use buffer.transform(target, \"base_link\"). The tf2_geometry_msgs header supplies the PointStamped transform support.": [
  "Utilisez buffer.transform(target, \"base_link\"). L’en-tête tf2_geometry_msgs fournit la transformation de PointStamped.",
  "Gebruik buffer.transform(target, \"base_link\"). De header tf2_geometry_msgs levert ondersteuning voor het transformeren van PointStamped.",
  "Usa buffer.transform(target, \"base_link\"). La cabecera tf2_geometry_msgs proporciona la transformación de PointStamped.",
  "Verwende buffer.transform(target, \"base_link\"). Der Header tf2_geometry_msgs stellt die Transformation von PointStamped bereit.",
  "Usa buffer.transform(target, \"base_link\"). O cabeçalho tf2_geometry_msgs permite transformar PointStamped.",
  "Usa buffer.transform(target, \"base_link\"). L’header tf2_geometry_msgs fornisce il supporto per trasformare PointStamped."
 ]
};
