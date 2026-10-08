export const meta = {
  name: 'catalogo-sustancias-lotes',
  description: 'Investiga y verifica el catálogo de sustancias de gym//TRK en lotes de 6-8, de 5 en 5, y se detiene si se acaba el límite',
  phases: [
    { title: 'Investigar', detail: 'un agente por lote (Sonnet), fuentes primarias' },
    { title: 'Verificar', detail: 'un verificador por lote intenta tumbar cada dato' },
  ],
}

const TAGS = ['sueno','sedacion','estimulante','ansiedad','animo','cognicion','fc','presion','apetito','glucosa','lipidos','higado','rinon','testosterona_propia','estrogeno','androgenico','prolactina','grasa','musculo','fuerza','recuperacion','resistencia','piel','pelo','digestivo','inflamacion','dolor','hueso','tiroides','libido','retencion','hematocrito','corazon','hidratacion','inmune','fertilidad','dependencia','temperatura','coagulacion','electrolitos','peso','cancer','vision','respiratorio']

// orden = prioridad: primero lo que el dueño toma o nombró (aminoácidos, ashwagandha, vitaminas D/K2, minerales, omega-3,
// minoxidil, mirtazapina/Xanax, skincare, esteroides, GHK-Cu/BPC-157, Reta, clenbuterol), luego lo demás
const FAMILIES = [
 {key:'amino', title:'Aminoácidos y derivados', cat:'supp', items:[
  ['l_teanina','L-teanina','Suntheanine; sueño, ansiedad, con cafeína'],['l_arginina','L-arginina','AAKG (alfa-cetoglutarato de arginina); óxido nítrico; herpes; presión'],['citrulina','L-citrulina','citrulina malato'],['glicina','Glicina','sueño (3 g antes de dormir)'],['taurina','Taurina',''],['tirosina','L-tirosina','N-acetil-L-tirosina (NALT)'],['glutamina','L-glutamina',''],['bcaa','BCAA','aminoácidos de cadena ramificada'],['eaa','EAA','aminoácidos esenciales'],['leucina','Leucina',''],['hmb','HMB','beta-hidroxi-beta-metilbutirato (Ca-HMB, ácido libre)'],['carnitina','L-carnitina','tartrato (LCLT), base; TMAO'],['alcar','Acetil-L-carnitina','ALCAR'],['nac','NAC','N-acetilcisteína'],['triptofano','L-triptófano',''],['htp5','5-HTP','5-hidroxitriptófano; síndrome serotoninérgico con ISRS'],['gaba','GABA',''],['lisina','L-lisina',''],['ornitina','L-ornitina',''],['agmatina','Agmatina',''],['betaina','Betaína','TMG, trimetilglicina'],['daa','Ácido D-aspártico','DAA'],['colageno','Colágeno hidrolizado','péptidos de colágeno, gelatina'],['glutation','Glutatión','oral, liposomal, IV']]},
 {key:'bot', title:'Botánicos y adaptógenos', cat:'supp', items:[
  ['ashwagandha','Ashwagandha','Withania somnifera; extractos KSM-66, Sensoril, Shoden; tiroides; casos de daño hepático; sueño'],['rhodiola','Rhodiola rosea',''],['ginseng','Ginseng (Panax)','coreano/americano'],['ginkgo','Ginkgo biloba','sangrado'],['curcuma','Cúrcuma','curcumina, con piperina; casos de daño hepático'],['jengibre','Jengibre',''],['tongkat','Tongkat ali','Eurycoma longifolia'],['fenogreco','Fenogreco','Trigonella foenum-graecum'],['maca','Maca',''],['tribulus','Tribulus terrestris',''],['shilajit','Shilajit','metales pesados'],['saw_palmetto','Saw palmetto','Serenoa repens'],['melena','Melena de león','Hericium erinaceus'],['cordyceps','Cordyceps',''],['reishi','Reishi','Ganoderma lucidum'],['mucuna','Mucuna pruriens','L-dopa'],['cardo','Cardo mariano','silimarina'],['te_verde','Extracto de té verde','EGCG; hepatotoxicidad en ayunas'],['canela','Canela',''],['ajo','Ajo (extracto)',''],['san_juan','Hierba de San Juan','interacciones graves (ISRS, anticonceptivos, inductor CYP3A4)'],['bacopa','Bacopa monnieri','']]},
 {key:'vit', title:'Vitaminas', cat:'supp', items:[
  ['vita','Vitamina A','retinol oral, palmitato de retinilo; betacaroteno como provitamina (toxicidad distinta); UI vs mcg RAE'],['vitb1','Vitamina B1','tiamina, benfotiamina'],['vitb2','Vitamina B2','riboflavina'],['niacina','Niacina','ácido nicotínico (flush, dosis para lípidos, hígado); NO es niacinamida (otra ficha)'],['vitb5','Vitamina B5','ácido pantoténico, pantetina'],['vitb6','Vitamina B6','piridoxina, piridoxal-5-fosfato (P5P); neuropatía por exceso'],['biotina','Biotina','B7; interfiere con análisis de laboratorio (troponina, tiroides)'],['folato','Folato','ácido fólico, metilfolato (5-MTHF), B9'],['vitb12','Vitamina B12','ciano/metil/hidroxocobalamina; oral, sublingual, inyectable'],['complejob','Complejo B','fórmulas con varias vitaminas B'],['vitc','Vitamina C','ácido ascórbico ORAL (la tópica es la ficha vitc_topica)'],['vitd','Vitamina D','D3 colecalciferol y D2 ergocalciferol; 40 UI = 1 mcg; dosis diarias altas (5000 UI) y nivel 25(OH)D; calcio'],['vite','Vitamina E','alfa-tocoferol natural y sintético; UI vs mg'],['vitk1','Vitamina K1','filoquinona'],['vitk','Vitamina K2 MK-7','menaquinona-7; "k2" suelto se refiere a esta; warfarina'],['vitk2mk4','Vitamina K2 MK-4','menatetrenona'],['multivit','Multivitamínico','fórmulas multivitamínicas/minerales genéricas (Centrum, Animal Pak, Opti-Men, One A Day)'],['colina','Colina','bitartrato de colina (citicolina y alfa-GPC son otras fichas)'],['inositol','Inositol','mio-inositol, D-chiro-inositol']]},
 {key:'min', title:'Minerales y electrolitos', cat:'supp', items:[
  ['magnesio','Magnesio','formas glicinato/bisglicinato, citrato, óxido, malato, treonato, cloruro, taurato, sulfato; fracción elemental de cada forma; sueño; diarrea'],['zinc','Zinc','picolinato, gluconato, citrato, óxido, bisglicinato; deficiencia de cobre por exceso'],['calcio','Calcio','carbonato, citrato'],['hierro','Hierro','sulfato ferroso, fumarato, bisglicinato; sobrecarga'],['potasio','Potasio','citrato, cloruro, gluconato; límites de venta libre; riñón'],['sodio','Sodio','sal, tabletas de sal'],['electrolitos','Electrolitos','sueros y sales de rehidratación (LMNT, Electrolit, Suerox, Pedialyte)'],['selenio','Selenio','selenometionina, selenito'],['yodo','Yodo','yoduro de potasio, kelp'],['cobre','Cobre','gluconato, bisglicinato'],['cromo','Cromo','picolinato de cromo'],['manganeso','Manganeso',''],['boro','Boro','citrato/glicinato de boro; testosterona libre'],['litio','Litio (orotato)','orotato de litio en microdosis como suplemento; el carbonato de litio es fármaco psiquiátrico (decir la diferencia)'],['zma','ZMA','zinc + magnesio aspartato + B6']]},
 {key:'otros_nutr', title:'Grasas, antioxidantes, digestión y articulaciones', cat:'supp', pre:[null,'otros_nutr-1.json',null], items:[
  ['omega3','Omega-3','EPA/DHA, aceite de pescado, krill, algas; dosis en mg de EPA+DHA; fibrilación auricular a dosis altas; sangrado'],['mct','MCT','triglicéridos de cadena media, C8'],['cla','CLA','ácido linoleico conjugado'],['gla','GLA','aceite de onagra o borraja'],['coq10','Coenzima Q10','ubiquinona, ubiquinol; estatinas'],['pqq','PQQ',''],['nmn','NMN','nicotinamida mononucleótido'],['nr','Nicotinamida ribósido','NR, Tru Niagen'],['resveratrol','Resveratrol',''],['ala','Ácido alfa-lipoico','ALA, R-ALA'],['astaxantina','Astaxantina',''],['psyllium','Psyllium','fibra, Metamucil'],['probioticos','Probióticos','cepas varias'],['enzimas','Enzimas digestivas','lactasa, bromelina, papaína'],['glucosamina','Glucosamina',''],['condroitina','Condroitina',''],['msm','MSM','metilsulfonilmetano'],['quercetina','Quercetina',''],['espermidina','Espermidina',''],['berberina','Berberina','glucosa; interacciones CYP']]},
 {key:'drug_a', title:'Fármacos: dolor, estómago, alergia, piel y pelo', cat:'drug', items:[
  ['minoxidil','Minoxidil','tópico 2–5% y oral en dosis bajas para alopecia; oral también antihipertensivo (dosis de ficha); una sola ficha con dosis por vía'],['finasterida','Finasterida','oral 1 mg (alopecia), 5 mg (próstata), tópica; reportes de síndrome post-finasterida; ánimo'],['dutasterida','Dutasterida',''],['espironolactona','Espironolactona','antiandrógeno para acné/alopecia en mujeres; potasio'],['ketoconazol','Ketoconazol','champú 2% vs oral (hepatotoxicidad, uso restringido)'],['isotretinoina','Isotretinoína','oral; teratógeno; lípidos, hígado, ánimo'],['doxiciclina','Doxiciclina','acné; fotosensibilidad'],['ibuprofeno','Ibuprofeno',''],['naproxeno','Naproxeno',''],['diclofenaco','Diclofenaco',''],['paracetamol','Paracetamol','acetaminofén; hígado; dosis máxima'],['aspirina','Aspirina','ácido acetilsalicílico'],['omeprazol','Omeprazol',''],['loratadina','Loratadina',''],['cetirizina','Cetirizina',''],['prednisona','Prednisona','corticosteroide oral; sueño, glucosa'],['ciclobenzaprina','Ciclobenzaprina','relajante muscular'],['metocarbamol','Metocarbamol','relajante muscular']]},
 {key:'drug_b', title:'Fármacos del sistema nervioso', cat:'drug', items:[
  ['alprazolam','Alprazolam','Xanax, Tafil; alcohol; dependencia; sueño'],['mirtazapina','Mirtazapina',''],['clonazepam','Clonazepam','Rivotril'],['diazepam','Diazepam','Valium'],['lorazepam','Lorazepam','Ativan'],['zolpidem','Zolpidem','Stilnox, Ambien'],['trazodona','Trazodona',''],['quetiapina','Quetiapina','Seroquel; dosis bajas para dormir fuera de indicación'],['sertralina','Sertralina',''],['fluoxetina','Fluoxetina',''],['escitalopram','Escitalopram',''],['bupropion','Bupropión','Wellbutrin; tabaquismo'],['difenhidramina','Difenhidramina','Benadryl, en somníferos de venta libre'],['doxilamina','Doxilamina',''],['metilfenidato','Metilfenidato','Ritalin, Concerta'],['lisdexanfetamina','Lisdexanfetamina','Vyvanse'],['anfetamina','Anfetamina','Adderall, sales mixtas'],['modafinilo','Modafinilo','y armodafinilo'],['gabapentina','Gabapentina',''],['pregabalina','Pregabalina','Lyrica'],['tramadol','Tramadol','opioide']]},
 {key:'skin', title:'Skincare y dermatología tópica', cat:'skin', items:[
  ['tretinoina','Tretinoína','ácido retinoico tópico'],['spf','Protector solar','filtros minerales y químicos'],['niacinamida','Niacinamida','tópica; mencionar nicotinamida oral para prevención de cáncer de piel'],['retinol','Retinol',''],['retinal','Retinal','retinaldehído'],['adapaleno','Adapaleno','Differin'],['tazaroteno','Tazaroteno',''],['salicilico','Ácido salicílico','BHA'],['glicolico','Ácido glicólico','AHA'],['lactico','Ácido láctico','AHA'],['mandelico','Ácido mandélico',''],['azelaico','Ácido azelaico',''],['vitc_topica','Vitamina C tópica','ácido L-ascórbico y derivados'],['benzoilo','Peróxido de benzoilo',''],['clindamicina','Clindamicina tópica',''],['hialuronico','Ácido hialurónico (tópico)',''],['ceramidas','Ceramidas',''],['hidroquinona','Hidroquinona','ocronosis'],['tranexamico','Ácido tranexámico','tópico y oral para melasma; trombosis'],['kojico','Ácido kójico',''],['arbutina','Arbutina','alfa-arbutina'],['bakuchiol','Bakuchiol',''],['centella','Centella asiática','madecassoside, cica'],['hidrocortisona','Hidrocortisona tópica','']]},
 {key:'aas', title:'Esteroides anabólico-androgénicos', cat:'hormone', pre:['aas-1.json','aas-2.json'], items:[
  ['testosterona','Testosterona',''],['nandrolona','Nandrolona',''],['trembolona','Trembolona',''],['boldenona','Boldenona',''],['metenolona','Metenolona',''],['oxandrolona','Oxandrolona',''],['estanozolol','Estanozolol',''],['oximetolona','Oximetolona',''],['metandienona','Metandienona',''],['drostanolona','Drostanolona',''],['mesterolona','Mesterolona',''],['turinabol','Turinabol',''],['metasterona','Metasterona',''],['fluoximesterona','Fluoximesterona',''],['dhea','DHEA','']]},
 {key:'pep_b', title:'Péptidos: reparación, piel, sexuales y otros', cat:'peptide', items:[
  ['bpc157','BPC-157','pentadecapéptido; datos humanos casi nulos; FDA categoría 2 para compounding'],['ghk_cu','GHK-Cu','péptido de cobre; cosmético tópico con evidencia; uso inyectable sin datos'],['tb500','TB-500','timosina beta-4 y su fragmento'],['melanotan2','Melanotan II','nevos, melanoma, priapismo'],['afamelanotida','Afamelanotida','Melanotan I; Scenesse aprobado'],['pt141','PT-141','bremelanotida, Vyleesi'],['epitalon','Epitalón','epithalon'],['selank','Selank',''],['semax','Semax',''],['dsip','DSIP','péptido inductor del sueño delta'],['timosina_a1','Timosina alfa-1','timalfasina, Zadaxin'],['ll37','LL-37','catelicidina'],['kpv','KPV','']]},
 {key:'pep_a', title:'Péptidos: secretagogos de GH y metabólicos', cat:'peptide', items:[
  ['retatrutida','Retatrutida','agonista triple GIP/GLP-1/glucagón; "reta"'],['cagrilintida','Cagrilintida','análogo de amilina; CagriSema'],['ipamorelina','Ipamorelina',''],['cjc1295','CJC-1295','con y sin DAC (mod GRF 1-29)'],['tesamorelina','Tesamorelina','Egrifta; aprobada para lipodistrofia por VIH'],['sermorelina','Sermorelina',''],['ghrp6','GHRP-6',''],['ghrp2','GHRP-2','pralmorelina'],['hexarelina','Hexarelina',''],['mots_c','MOTS-c',''],['aod9604','AOD-9604','fragmento de GH'],['amino1mq','5-amino-1MQ','cat other; molécula pequeña inhibidora de NNMT, no es péptido'],['ss31','SS-31','elamipretida'],['kisspeptina','Kisspeptina',''],['gonadorelina','Gonadorelina','GnRH']]},
 {key:'endo', title:'Endocrinos y moduladores hormonales', cat:'hormone', items:[
  ['clenbuterol','Clenbuterol','no aprobado en humanos en EE.UU.; cardiotoxicidad'],['levotiroxina','Levotiroxina','T4; Synthroid, Eutirox'],['liotironina','Liotironina','T3; Cytomel'],['salbutamol','Salbutamol','cat drug; albuterol, Ventolin'],['hcg','hCG','gonadotropina coriónica humana'],['clomifeno','Clomifeno','Clomid'],['enclomifeno','Enclomifeno',''],['tamoxifeno','Tamoxifeno','Nolvadex'],['raloxifeno','Raloxifeno','Evista'],['anastrozol','Anastrozol','Arimidex'],['letrozol','Letrozol','Femara'],['exemestano','Exemestano','Aromasin'],['cabergolina','Cabergolina','cat drug; Dostinex; prolactina; valvulopatía'],['pregnenolona','Pregnenolona','']]},
 {key:'sleep_otras', title:'Sueño y calma, y otras sustancias', cat:'supp', pre:[null,'sleep_otras-1.json'], items:[
  ['melatonina','Melatonina',''],['apigenina','Apigenina','manzanilla'],['valeriana','Valeriana',''],['lavanda','Lavanda (Silexan)',''],['passiflora','Pasiflora',''],['magnolia','Magnolia','honokiol'],['kava','Kava','hígado'],['lupulo','Lúpulo',''],['azafran','Azafrán','ánimo, sueño'],['alcohol','Alcohol','cat other; etanol; bebida estándar (14 g); sueño REM, FC, HRV, síntesis de proteína, testosterona'],['nicotina','Nicotina','cat other; cigarro, vape, bolsas (Zyn), chicle, parche'],['thc','Cannabis (THC)','cat other; fumado, vapeado, comestibles; sueño; abstinencia'],['cbd','CBD','cat other; cannabidiol; interacciones CYP; hígado'],['cbn','CBN','cat other; cannabinol'],['kratom','Kratom','cat other; mitraginina; dependencia']]},
 {key:'stim', title:'Estimulantes y nootrópicos', cat:'supp', items:[
  ['teacrina','Teacrina','TeaCrine'],['paraxantina','Paraxantina','enfinity'],['sinefrina','Sinefrina','naranja amarga, p-sinefrina'],['yohimbina','Yohimbina','presión, ansiedad'],['hordenina','Hordenina',''],['dmaa','DMAA','cat other; 1,3-dimetilamilamina, geranio; prohibida; eventos cardiovasculares'],['dmha','DMHA','cat other; 2-aminoisoheptano, octodrine'],['efedrina','Efedrina','cat drug; controlada; ECA'],['alfa_gpc','Alfa-GPC','alfoscerato de colina'],['citicolina','Citicolina','CDP-colina, Cognizin'],['huperzina','Huperzina A',''],['noopept','Noopept','cat other; omberacetam'],['piracetam','Piracetam','cat drug; Nootropil'],['fenilpiracetam','Fenilpiracetam','cat drug; Phenotropil; WADA'],['fenibut','Fenibut','cat other; tolerancia, abstinencia grave'],['tianeptina','Tianeptina','cat drug; abuso, "gas station heroin", abstinencia']]},
 {key:'drug_c', title:'Fármacos metabólicos, cardiovasculares y sexuales', cat:'drug', items:[
  ['metformina','Metformina',''],['semaglutida','Semaglutida','Ozempic, Wegovy, Rybelsus'],['tirzepatida','Tirzepatida','Mounjaro, Zepbound'],['liraglutida','Liraglutida','Saxenda, Victoza'],['fentermina','Fentermina','controlada'],['orlistat','Orlistat','Xenical'],['empagliflozina','Empagliflozina','Jardiance'],['atorvastatina','Atorvastatina',''],['rosuvastatina','Rosuvastatina',''],['propranolol','Propranolol',''],['losartan','Losartán',''],['telmisartan','Telmisartán',''],['amlodipino','Amlodipino',''],['tadalafilo','Tadalafilo','Cialis'],['sildenafilo','Sildenafilo','Viagra'],['furosemida','Furosemida','diurético; mal uso para "secar"'],['hidroclorotiazida','Hidroclorotiazida','diurético']]},
 {key:'sarm_gh', title:'SARMs, hormona de crecimiento e insulina', cat:'hormone', items:[
  ['ostarina','Ostarina','enobosarm, MK-2866'],['ligandrol','Ligandrol','LGD-4033'],['rad140','RAD-140','testolona'],['andarina','Andarina','S4; visión'],['yk11','YK-11',''],['cardarina','Cardarina','GW-501516; agonista PPAR-delta (no es SARM); cáncer en animales'],['sr9009','SR9009','stenabolic; biodisponibilidad oral pobre'],['mk677','MK-677','ibutamoren; secretagogo oral de GH, no es SARM ni péptido; glucosa, apetito'],['somatropina','Hormona de crecimiento','somatropina, hGH, GH'],['igf1','IGF-1','mecasermina, IGF-1 LR3'],['insulina','Insulina','hipoglucemia grave'],['dnp','DNP','cat other; 2,4-dinitrofenol; muertes; sin dosis segura'],['aicar','AICAR','activador de AMPK; WADA']]},
]

const CATDEF = "supp = dietary supplement, nutrient, amino acid, botanical; drug = approved medicine (Rx or OTC), including approved GLP-1s; hormone = hormones and performance-enhancing drugs (AAS, prohormones, SARMs, GH, MK-677, insulin, IGF-1, thyroid hormones, SERMs, aromatase inhibitors, hCG, clenbuterol, cardarine); peptide = peptides used as research or performance compounds (even if one has an approved indication); skin = topical dermatology and skincare; other = recreational or unregulated substances (alcohol, nicotine, cannabis, kratom, banned stimulants, DNP). Use the cat given for each item: the family cat unless the hint says 'cat X'."

const RULES = `Hard rules:
1. Harm reduction, not coaching. Report only what studies, official labels and regulators state. Doses appear ONLY as ranges from published human studies, official labels or official intake references, each with its kind, context and source: kind 'rda' (recommended intake), 'estudiado' (used in human trials), 'ficha' (official label), 'ul' (tolerable upper intake level), 'suprafisiologico' (high doses given in a published human study, e.g. testosterone 600 mg/week in Bhasin 1996), 'toxico' (dose where toxicity is reported). Never write recommended or suggested doses for the user, cycles, stacks, post-cycle protocols, injection or dosing technique, sourcing, how to evade testing, or how to reduce side effects by adjusting doses. If there are no human data (only animal or in vitro), set human 'no' and doses [] and never extrapolate animal doses. If no dose is considered safe (e.g. DNP), doses [] and state it in a 'grave' side effect.
2. Every dose range, effect, side effect, interaction and monitor item cites at least one source by its number n in 'sources'. Sources must be real and checked by you: PubMed (give the PMID), a DOI, or an official page (DailyMed/FDA label, EMA, COFEPRIS, NIH Office of Dietary Supplements fact sheet, LiverTox, WADA 2026 Prohibited List). Prefer systematic reviews, meta-analyses and RCTs; NIH ODS fact sheets and drug labels cover many facts at once. Do not cite blogs, vendors, forums, Examine or Wikipedia. If you cannot verify a claim, leave it out.
3. Evidence grade ev: A = several RCTs or a meta-analysis in humans; B = some RCTs or consistent human data; C = small or preliminary human data; D = animal or in vitro only, or anecdotal. The entry's ev is for its main use.
4. All user-facing text in Spanish (Mexico), short and neutral: one sentence per item, at most 140 characters, no emojis, no hype, no advice in the imperative. 'what' = what it is; 'use' = what people use it for. Names as people in Mexico say them.
5. aliases: everything a user might type to log it: Spanish and English names, INN, brand names in Mexico and the US, gym slang and abbreviations (e.g. 'var', 'deca', 'test e', 'reta'), codes ('ksm-66', 'mk-7', 'bpc-157'), salts, esters and forms, and one or two frequent misspellings. Lowercase. Do not include generic words that would collide with another substance or a common Spanish word unless it is the standard slang. Never an alias that belongs to another substance (e.g. 'mk-677' is ibutamoren, 'mk-7' is vitamin K2, 'mk-2866' is ostarine).
6. Tags (entry tags, effects[].tag, sides[].tag) only from: ${TAGS.join(', ')}.
7. sleep: effect mejora / empeora / mixto / ninguno / desconocido, with a short text and a source unless desconocido. halfH = approximate elimination half-life in hours of the form most used (number), when known; the app uses it to flag intake close to bedtime.
8. status: mx (COFEPRIS: suplemento, venta libre, receta, controlado (grupo), no aprobado), us (FDA: Rx, OTC, dietary supplement, not approved, DEA schedule), wada (permitido, prohibido S1..S9 or M, prohibido solo en competencia, programa de monitoreo), note optional (e.g. 'retirado del mercado en EE.UU. en 2023').
9. unit = the unit people use to log it (mg, mcg, UI, g, ml, %, aplicacion, etc.). Use the same unit in doses when possible. conv only when units convert (vitamin D 40 UI = 1 mcg; vitamin A; vitamin E).
10. forms (mineral salts, esters, extracts): name, aliases, elem = elemental fraction 0..1 for mineral salts, note = what changes (half-life for esters, absorption). For minerals, express every dose range as the ELEMENTAL mineral (mg of magnesium, not mg of magnesium glycinate): the app converts the salt the user logs.
11. inter: clinically relevant interactions, especially with other things people in this app take (alcohol, benzodiazepines, SSRIs, stimulants, anticoagulants, other hormones, GLP-1, grapefruit, NSAIDs). 'with' = lowercase names.
12. monitor: what labels or guidelines say to check (labs, blood pressure, resting heart rate, sleep, mood) and why.
13. Be efficient with your context (there is a usage limit): for PubMed use Bash curl on E-utilities, e.g. curl -s --retry 5 --retry-delay 2 --retry-all-errors "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=5&term=..." then esummary (batch many ids in one call) or efetch rettype=abstract&retmode=text for the abstract. If Bash curl fails, try PowerShell curl.exe or WebFetch. Use WebSearch/WebFetch for labels and regulators, and prefer one source that covers several facts (a label, an ODS fact sheet, a meta-analysis). Do not read full texts when the abstract states the number.
14. sub = the pharmacological or chemical class in Spanish, lowercase, singular, 1 to 4 words, using the standard class name when one exists (benzodiacepina, antidepresivo ISRS, AINE, estatina, agonista GLP-1, esteroide anabólico, SARM, retinoide tópico). The app matches interactions by exact name or by class, so in inter.with list each interacting substance by its common Spanish name and, when the interaction is with a whole class, the class name in plural (benzodiacepinas, ISRS, AINEs, anticoagulantes, estatinas, opioides, estimulantes, nitratos). Never a vague phrase.`

const ENTRY = {
  type: 'object',
  properties: {
    id: { type: 'string' }, name: { type: 'string' },
    cat: { type: 'string', enum: ['supp','drug','hormone','peptide','skin','other'] },
    sub: { type: 'string' }, aliases: { type: 'array', items: { type: 'string' } },
    route: { type: 'array', items: { type: 'string', enum: ['oral','sublingual','topica','inyectable_im','inyectable_sc','inyectable_iv','intranasal','inhalada','transdermica','otra'] } },
    unit: { type: 'string' },
    conv: { type: 'object', properties: { mcg_per_ui: { type: 'number' }, mg_per_ui: { type: 'number' }, note: { type: 'string' } } },
    forms: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, aliases: { type: 'array', items: { type: 'string' } }, elem: { type: 'number' }, note: { type: 'string' } }, required: ['name'] } },
    half: { type: 'string' }, halfH: { type: 'number' }, what: { type: 'string' }, use: { type: 'string' },
    human: { type: 'string', enum: ['si','limitado','no'] },
    doses: { type: 'array', items: { type: 'object', properties: {
      kind: { type: 'string', enum: ['rda','estudiado','ficha','ul','suprafisiologico','toxico'] },
      ctx: { type: 'string' }, min: { type: 'number' }, max: { type: 'number' }, unit: { type: 'string' },
      per: { type: 'string', enum: ['dosis','dia','semana','aplicacion'] }, route: { type: 'string' },
      src: { type: 'array', items: { type: 'integer' } } }, required: ['kind','ctx','unit','per','src'] } },
    effects: { type: 'array', items: { type: 'object', properties: {
      tag: { type: 'string' }, text: { type: 'string' }, dose: { type: 'string' }, ev: { type: 'string', enum: ['A','B','C','D'] },
      src: { type: 'array', items: { type: 'integer' } } }, required: ['tag','text','ev','src'] } },
    sides: { type: 'array', items: { type: 'object', properties: {
      tag: { type: 'string' }, text: { type: 'string' }, freq: { type: 'string', enum: ['comun','ocasional','raro','grave'] }, dose: { type: 'string' },
      src: { type: 'array', items: { type: 'integer' } } }, required: ['text','freq','src'] } },
    monitor: { type: 'array', items: { type: 'object', properties: { what: { type: 'string' }, why: { type: 'string' }, src: { type: 'array', items: { type: 'integer' } } }, required: ['what','why'] } },
    inter: { type: 'array', items: { type: 'object', properties: {
      with: { type: 'array', items: { type: 'string' } }, text: { type: 'string' }, sev: { type: 'string', enum: ['grave','moderada','leve'] },
      src: { type: 'array', items: { type: 'integer' } } }, required: ['with','text','sev','src'] } },
    sleep: { type: 'object', properties: { effect: { type: 'string', enum: ['mejora','empeora','mixto','ninguno','desconocido'] }, text: { type: 'string' }, src: { type: 'array', items: { type: 'integer' } } }, required: ['effect'] },
    timing: { type: 'string' },
    status: { type: 'object', properties: { mx: { type: 'string' }, us: { type: 'string' }, wada: { type: 'string' }, note: { type: 'string' } } },
    ev: { type: 'string', enum: ['A','B','C','D'] }, tags: { type: 'array', items: { type: 'string' } },
    sources: { type: 'array', items: { type: 'object', properties: {
      n: { type: 'integer' }, cite: { type: 'string' }, pmid: { type: 'string' }, doi: { type: 'string' }, url: { type: 'string' },
      kind: { type: 'string', enum: ['metaanalisis','revision','ensayo','observacional','ficha','guia','regulador','animal','caso','otro'] } }, required: ['n','cite'] } },
  },
  required: ['id','name','cat','sub','aliases','route','unit','what','use','human','doses','effects','sides','sleep','status','ev','tags','sources'],
}
const RES_OUT = { type: 'object', properties: { entries: { type: 'array', items: ENTRY }, notes: { type: 'string' } }, required: ['entries'] }
const VER_OUT = { type: 'object', properties: {
  entries: { type: 'array', items: ENTRY },
  changes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, field: { type: 'string' }, what: { type: 'string' } }, required: ['id','what'] } },
  unverified: { type: 'array', items: { type: 'string' } },
}, required: ['entries','changes'] }

const PRE = 'C:\\Users\\XboxL\\AppData\\Local\\Temp\\claude\\I--My-Drive-AI-SYSTEM\\378d8f03-534e-4f62-8792-de26eaf9d799\\scratchpad\\v295\\pre\\'
// lotes de 6-8, repartidos parejo dentro de cada familia
const CHUNKS = []
FAMILIES.forEach(f => { const n = f.items.length, k = Math.ceil(n / 8), size = Math.ceil(n / k);
  for (let i = 0; i < k; i++) CHUNKS.push({ key: f.key + '#' + i, fam: f, items: f.items.slice(i * size, (i + 1) * size), pre: f.pre && f.pre[i] ? PRE + f.pre[i] : null }) })
const list = c => c.items.map(([id, name, hint]) => '- ' + id + ' | ' + name + (hint ? ' | ' + hint : '')).join('\n')

const researchPrompt = c => `You are building part of the substance catalog for gym//TRK, a fitness tracker (single-file web app) where people log anything they put in their body: supplements, medicines, hormones, peptides, skincare. The app identifies what they typed, then shows what the literature reports at the dose they logged (within studied range, above it, or no human data), side effects, what to monitor, interactions with the rest of their stack, effect on sleep, legal status and evidence level; later it correlates intake with their own sleep, heart rate, strength and weight. Your output becomes data the app shows as-is to a Spanish-speaking user in Mexico, so accuracy matters more than volume.

Family: ${c.fam.title}. Default cat: ${c.fam.cat}.
Categories: ${CATDEF}

Substances (id | name | hint):
${list(c)}

${RULES}

Return all ${c.items.length} substances in this order, each with exactly the id given. Number sources 1..n inside each entry. If something genuinely has little evidence, say so (low ev, human 'limitado' or 'no', few effects) instead of padding.`

const verifyPrompt = (c, entries) => `You are the adversarial verifier for part of the gym//TRK substance catalog (family: ${c.fam.title}). A researcher produced the entries ${entries ? 'below' : 'in the JSON file ' + c.pre + ' (read it with the Read tool; it is a JSON array of entries)'}. Try to refute every fact and return the corrected entries. People will see this data as-is; a wrong dose range, an invented or mismatched source, or a missing serious risk is harmful.

For every entry:
1. Sources: resolve every PMID, DOI and URL (PubMed esummary accepts many ids in one call). Remove sources that do not exist or do not say what is cited, together with the claims that relied only on them, or replace them with a real source you checked.
2. Doses: check each range against its source (number, unit, per day or week, route, population, kind). Fix or remove. Enforce the hard rule: only label, intake-reference or published-study doses with context; nothing that reads like a protocol, cycle, stack, post-cycle plan, technique or sourcing. Animal-only data: human 'no' and doses [].
3. Safety: add missing serious ('grave') side effects, boxed warnings and dangerous interactions, with sources. Check monitor items match labels or guidelines.
4. Identity: aliases must refer to this substance; remove any that belong to another one, add missing common ones (brands in Mexico and the US, gym slang, misspellings).
5. cat, sub, status (COFEPRIS, FDA, WADA 2026), ev, halfH, tags and Spanish text: correct, short, neutral.
Record every change in 'changes' (id, field, what). List ids you could not verify in 'unverified'. Return ALL ${c.items.length} entries (${c.items.map(x => x[0]).join(', ')}), corrected, same ids and order.

Categories: ${CATDEF}

${RULES}
${entries ? '\nEntries to verify (JSON):\n' + JSON.stringify(entries) : ''}`

const skip = (args && args.skip) || []
const only = args && args.only
const todo = CHUNKS.filter(c => !skip.includes(c.key) && (!only || only.includes(c.key)))
const N = (args && args.workers) || 5
log('lotes: ' + todo.length + ' de ' + CHUNKS.length + ' · de ' + N + ' en ' + N + (skip.length ? ' · ya hechos: ' + skip.length : ''))

let stop = false
const done = []
const runChunk = async c => {
  let entries = null
  if (!c.pre) {
    const r = await agent(researchPrompt(c), { label: 'inv:' + c.key, phase: 'Investigar', schema: RES_OUT, model: 'sonnet' })
    if (!r || !r.entries || !r.entries.length) { stop = true; return { key: c.key, ok: false, step: 'investigar' } }
    entries = r.entries
  }
  const v = await agent(verifyPrompt(c, entries), { label: 'ver:' + c.key, phase: 'Verificar', schema: VER_OUT })
  if (!v || !v.entries || !v.entries.length) { stop = true; return { key: c.key, ok: false, step: 'verificar', researched: !!entries } }
  return { key: c.key, ok: true, n: v.entries.length, changes: v.changes.length, unverified: v.unverified || [] }
}
const queue = todo.slice()
const worker = async () => { while (queue.length && !stop) { const c = queue.shift(); const r = await runChunk(c); done.push(r); log((r.ok ? '✓ ' : '✗ ') + r.key + (r.ok ? ' · ' + r.n + ' fichas · ' + r.changes + ' cambios' : ' · se cortó en ' + r.step)) } }
await Promise.all(Array.from({ length: N }, () => worker()))
if (stop) log('se detuvo (probablemente el límite de uso): quedan ' + queue.length + ' lotes sin empezar')
return { done, pending: queue.map(c => c.key) }
