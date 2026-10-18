# VoedKompas — gegevens en herkomst

Gecontroleerd op 18 oktober 2026. Dit document beschrijft de ingebouwde gegevens in `dist/nutrition-data.js`.

## Omvang en betekenis

- 36 registraties: 13 vitamines, 14 mineralen en 9 energie-, macro-, zout-, vezel- en drinkvelden.
- 40 gewone voedingsmiddelen, rechtstreeks geselecteerd uit de officiële Britse CoFID 2021-werkmap.
- 1.151 numerieke voedingswaarden en 249 expliciet onbekende of niet gekwantificeerde waarden.
- Alle voedselwaarden gelden **per 100 gram eetbaar product**, ook bij melk. Voorgestelde portiegewichten zijn aanpasbare voorbeelden, geen onderzoeksmetingen of individuele voedingsadviezen.
- De Nederlandse namen zijn vertaald; `sourceCode` en `sourceName` bewaren de oorspronkelijke CoFID-code en voedselomschrijving.

## Referentiewaarden

[Verordening (EU) 1169/2011, bijlage XIII](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011R1169) levert de standaardwaarden voor volwassenen. Het zijn **etiketreferenties**, geen persoonlijke behoeften, diagnosegrenzen of veilige bovengrenzen voor supplementen. Leeftijd, zwangerschap, borstvoeding, medische toestand en activiteit zijn hiermee niet gepersonaliseerd.

Energie 2.000 kcal; eiwit 50 g; koolhydraten 260 g; vet 70 g; verzadigd vet 20 g; totaal suikers 90 g; zout 6 g. Het vezelvoorbeeld van 30 g en drinkvoorbeeld van 2.000 ml komen niet uit deze EU-tabel en zijn uitdrukkelijk aanpasbaar.

De EU-referentie voor vitamine D is 5 µg. Deze waarde mag niet worden gepresenteerd als een Nederlands suppletieadvies. Biotine is **50 µg**, niet 50 mg; sommige historische Nederlandse webweergaven van de verordening bevatten hier een afwijkende eenheid. De Engelstalige tabel is gecontroleerd.

`kind` helpt de interface: `minimum` is een vergelijkingsdoel, `limit` is een begrenzing voor zout/verzadigd vet en `reference` is een neutrale vergelijkingswaarde. Suikers, chroom en fluoride mogen geen melding “je moet meer nemen” krijgen. Een getal boven 100% is niet automatisch schadelijk en is geen supplementveiligheidsbeoordeling.

## Voedingsmiddelentabel en omzettingen

Bron: [Public Health England — Composition of Foods Integrated Dataset, 2021](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid).

Gedownloade werkmap: [CoFID 2021 XLSX](https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx).

Gebruikte tabbladen: `1.3 Proximates`, `1.4 Inorganics`, `1.5 Vitamins`. Waarden zijn samengevoegd op `Food Code`, niet op vertaalde naam.

- `KCALS`, `PROT`, `CHO`, `FAT`, `SATFOD`, `TOTSUG` en `AOACFIB` zijn overgenomen als respectievelijk energie, eiwit, koolhydraten, vet, verzadigd vet, suikers en vezels.
- Zout in gram = natrium in milligram × 2,5 ÷ 1.000. Dit is een zout-equivalent uit totaal natrium, niet alleen toegevoegd keukenzout.
- Vitamine A gebruikt `RETEQU` (retinolequivalenten), niet alleen retinol en niet de Amerikaanse RAE-eenheid.
- Vitamine B3 gebruikt `NIACEQU` (niacine-equivalenten, inclusief tryptofaanbijdrage).
- Vitamine K gebruikt alleen `VITK1`. De resultaten geven daarom geen volledige K1+K2-inname weer.
- Folaat gebruikt `FOLT`. De app converteert niet naar Amerikaanse dietary folate equivalents (DFE); natuurlijke folaten en synthetisch foliumzuur verschillen in opname.
- Vocht uit voedsel is niet toegevoegd aan `values.water`; de drinkregistratie telt afzonderlijk ingevoerde dranken.
- CoFID bevat in deze tabellen geen fluoride, chroom en molybdeen: die zijn overal `null`.
- Lege cellen en `N` (geen betrouwbare kwantificering) worden `null`. `Tr` (spoor) wordt eveneens `null`, met de sleutel opgenomen in `traceNutrients`. Alleen numerieke nullen uit de bron blijven `0`.
- De voedingswaarden zijn gemiddelden en schattingen uit de brondataset. Britse samenstelling, verrijking, bereidingswijze en zoutgebruik kunnen verschillen van Nederlandse producten. Jodium in brood is een belangrijk voorbeeld: de Britse waarde vertegenwoordigt niet automatisch Nederlands gejodeerd bakkerszout.
- De bron gebruikt eigen analysemethoden en energie-/koolhydraatdefinities. Bereken energie niet opnieuw uit 4/4/9 om de bronwaarde te vervangen.

Bevat overheidsinformatie onder de [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). Attributie: Public Health England, McCance and Widdowson’s Composition of Foods Integrated Dataset 2021; bevat informatie van de publieke sector onder OGL v3.0. De bron onderschrijft deze app niet.

## Gezondheidsinformatie

[NIH Office of Dietary Supplements](https://ods.od.nih.gov/factsheets/list-VitaminsMinerals/) is de primaire bron voor uitleg over vitamines en mineralen, echte tekorten, voedingsbronnen en overmaat. Elke nutrientrecord verwijst in `source` naar zijn eigen consumentenfiche. De teksten zijn beknopte Nederlandse samenvattingen; de Amerikaanse dagelijkse adviezen zijn niet overgenomen als appdoelen.

Nederlandse aanvullende uitleg: [eiwitten](https://www.voedingscentrum.nl/encyclopedie/eiwitten.aspx), [koolhydraten](https://www.voedingscentrum.nl/encyclopedie/koolhydraten.aspx), [vetten](https://www.voedingscentrum.nl/encyclopedie/vetten.aspx), [suiker](https://www.voedingscentrum.nl/encyclopedie/suiker.aspx), [vezels](https://www.voedingscentrum.nl/encyclopedie/vezels.aspx), [vocht](https://www.voedingscentrum.nl/encyclopedie/vocht.aspx), [zout](https://www.voedingscentrum.nl/encyclopedie/zout-en-natrium.aspx), [chloride](https://www.voedingscentrum.nl/encyclopedie/chloor.aspx) en [ondervoeding](https://www.voedingscentrum.nl/encyclopedie/ondervoeding.aspx) van het Voedingscentrum.

De uitleg maakt geen omgekeerde diagnose uit klachten. Zinktekort kan bijvoorbeeld diarree geven, vooral bij kinderen, maar diarree heeft veel andere oorzaken. Eén dag met weinig geregistreerd zink stelt geen tekort vast. Een tekort is ook mogelijk bij voldoende berekende inname, bijvoorbeeld door opnameproblemen. Supplementen worden niet gedoseerd of automatisch aanbevolen.

## Integratie en datakwaliteit

ES-module exports: `NUTRIENTS`, `FOODS`, `SOURCES`, `DATA_NOTE`.

`NUTRIENTS`: `id`, `name`, `unit`, `target`, `group`, `kind`, `about`, `low`, `foods`, `source`, `high`, `targetSource`, `targetNote`.

`FOODS`: `id`, `name`, `emoji`, `category`, `serving`, `servingLabel`, `basis`, `source`, `sourceCode`, `sourceName`, `values`, `traceNutrients`.

Bij optellen: alleen eindige numerieke waarden tellen. Als alle bijdragen onbekend zijn, toon onbekend in plaats van 0. Als slechts een deel bekend is, benoem dat het totaal onvolledig is. Voeg onbekende velden niet toe als nul bij het maken van eigen producten of importeren van etiketgegevens. Een score onder een referentie krijgt taal als “onder referentie” of “weinig geregistreerd”, nooit de diagnose “tekort”. Geen voedingsinvoer is een lege registratie, geen dag waarop de gebruiker niets heeft gegeten.
