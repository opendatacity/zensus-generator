//Tip: Wenn der Stack nicht ausreicht um das GeoJSON zu laden...
//     ...aufrufen mit:
// node --stack_size=8192 ".\3_1 match norden gemeinden.js"
// Auch dann scheitert node ein paar mal und dann springt der Diesel an oder so


/*
 Ok, das System funktioniert in den folgenden Schritten.

 1. Die Vektordaten als GeoJSON laden. (loadGeoJSON)
 2. Die Zahlendaten als CSV laden. (loadCSV)
 3. Die gewünschten Werte der CSV zum GeoJSON hinzufügen. (geojson.match)
 4. Die darzustellen Werte festlegen und als Farb-Indizes zum GeoJSON hinzufügen. (geojson.setFields)
 5. Alle Angaben exportieren, inklusive:
 - Mapnik-XML-Konfiguration
 - GeoJSON inklusive Geodaten, der neuen Werte und der Farbindizes
 - Lokaler-Frontend-JSONs
 - Gradienten-Bildchen für die Legende
 - Vorschaubilder
 6. Das GeoJSON muss in ein Shape umgewandelt werden - notfalls per Konsole mit ogr2ogr

 */


var match = require('./modules/match.js');
var fs = require('fs');

//Lade Mapping für Mecklenburg-Vorpommern GSA-Umbennenung
var mp_mapping = JSON.parse(fs.readFileSync('./geojson/meckpom_mapping_obj.json', 'utf8'));

// Lade GeoJSON - hier die Gemeinden
var geojson = match.loadGeoJSON('./geojson/gemeinden_norden.json');

var convertInteger = function (v) {
	return parseInt(v, 10)
};
var convertNumber = function (v) {
	return parseFloat(v)
};
var convertPointedInteger = function (v) {
	v = v.replace(/\./g, '');
	return parseInt(v, 10)
};

var translateID = function (id) {
	if ((id[0] == 1) && (id[1] == 3)) {
		if (!mp_mapping[id]) {
			console.log('Missing Mapping: ' + id);
		}
		return mp_mapping[id];
	}
	return id;
};

var foreignFieldAGS = function (entry) {
//	properties
	var ags = entry['AGS'];

	if (ags.length == 3) {
		//Braunschweig 031
		//Braunschweig 03100000
		ags = ags + '00000';
	} else if (ags.length == 5) {
		//Kiel 01002
		//Kiel 01002000
		ags = ags + '000';
	} else if (ags.length == 11) {
//		03357[403]004;Basdahl
//		03357004;Basdahl
		ags = ags.substr(0, 5) + ags.substr(8, 3);
	}
	return ags;
};

// Hier werden die Gradienten definiert.
var gGelbRot = ['DDDDDD', 'FFFFE5', 'FFF7BC', 'FEE391', 'FEC44F', 'FE9929', 'EC7014', 'CC4C02', '993404', '662506'];
var gViolettGruen = ['F7F7F7', '1b7837', '5aae61', 'a6dba0', 'd9f0d3', 'f7f7f7', 'e7d4e8', 'c2a5cf', '9970ab', '762a83'];
var gWeissBlau = ['FFFFFF', 'FFF7FB', 'ECE7F2', 'D0D1E6', 'A6BDDB', '74A9CF', '3690C0', '0570B0', '045A8D', '023858'];
var gWeissGruen = ['FFFFFF', 'f7fcf5', 'e5f5e0', 'c7e9c0', 'a1d99b', '74c476', '41ab5d', '238b45', '006d2c', '00441b'];
var gWeissRot = ['FFFFFF', 'fff5f0', 'fee0d2', 'fcbba1', 'fc9272', 'fb6a4a', 'ef3b2c', 'cb181d', 'a50f15', '67000d'];


//  ZENUSDATEN

geojson.match({

	/*
	 Lade die CSV als "Array of Objects".
	 Jede Zeile wird dabei zu einem Object,
	 die Spaltenüberschriften werden zu den jeweiligen Object-Keys,
	 die Wert werden zu den jeweiligen Object-Values,
	 */
	data: match.loadCSV('../shared/wikipedia/Gemeinden_wikipedia.csv'),

	// Bei Matching wird der Spaltenname "myField" im geoJSON gesucht in der CSV "foreignField"
	myField: 'RAU_RS',
	foreignField: 'RS_ALT,C,20',

	// Welche Felder sollen übernommen werden? Jeder Eintrag besteht dabei aus:
	// "name": Feldname in der CSV
	// "newName": Neuer Name, falls es denn ein anderer sein soll
	// "convert": Eine Funktion, die einen String übergeben bekommt.
	addFields: [
		{
			name: 'LINK,C,65',
			newName: 'wiki',
			convert: function (v) {
				if (v == 'none') return undefined;
				if (v.substr(0, 31) == 'http://de.m.wikipedia.org/wiki/') return v.substr(31);
				console.log(v);
			}
		}
	],

	// Manchmal existieren keine Daten zu den Gemeinden, weil dort niemand wohnt.
	// Also ignoriere Warnungen für "gemeindefreie" Gebiete
	hideWarning: function (properties) {
		return true;
	}
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/demo_zip/Zensus_Demographie_V1_28Mai2013.csv'),
	myField: 'RAU_RS',
	foreignField: 'AGS',
	addFields: [
		{name: 'EWZ', convert: convertInteger },
		{name: 'EW_M', convert: convertInteger },
		{name: 'EW_W', convert: convertInteger },
		{name: 'EW_D', convert: convertInteger },
		{name: 'EW_A', convert: convertInteger },
		{name: 'ALTER_1', convert: convertInteger },
		{name: 'ALTER_2', convert: convertInteger },
		{name: 'ALTER_3', convert: convertInteger },
		{name: 'ALTER_4', convert: convertInteger },
		{name: 'ALTER_5', convert: convertInteger }
	],
	hideWarning: function (properties) {
		return true;
	}
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/gwz_zip/Kennzahlen_Gebaeude_und_Wohnungen_2011_V1_28Mai2013.csv'),
	myField: 'RAU_RS',
	foreignField: 'AGS',
	addFields: [
		{name: 'GEB', convert: convertInteger },
		{name: 'WOGEB', convert: convertInteger },
		{name: 'SOGEB', convert: convertInteger },
		{name: 'WOHEIM', convert: convertInteger },
		{name: 'BEWUK', convert: convertInteger },
		{name: 'EFH', convert: convertInteger },
		{name: 'EFHPC', convert: convertNumber  },
		{name: 'FREFH', convert: convertInteger },
		{name: 'FREFHPC', convert: convertNumber  },
		{name: 'ETW', convert: convertInteger },
		{name: 'ETWPC', convert: convertNumber  },
		{name: 'KOM', convert: convertInteger },
		{name: 'KOMPC', convert: convertNumber  },
		{name: 'FHZ', convert: convertInteger },
		{name: 'FHZPC', convert: convertNumber  },
		{name: 'OFEN', convert: convertInteger },
		{name: 'OFENPC', convert: convertNumber  },
		{name: 'BAUJ1PC', convert: convertNumber  },
		{name: 'BAUJ2PC', convert: convertNumber  },
		{name: 'BAUJ3PC', convert: convertNumber  },
		{name: 'WHG', convert: convertInteger },
		{name: 'WWOGEB', convert: convertInteger },
		{name: 'WSOGEB', convert: convertInteger },
		{name: 'WWOHEIM', convert: convertInteger },
		{name: 'WBEWUK', convert: convertInteger },
		{name: 'WEIGEN', convert: convertInteger },
		{name: 'WMIET', convert: convertInteger },
		{name: 'WLEER', convert: convertInteger },
		{name: 'ETQ', convert: convertNumber  },
		{name: 'LEQ', convert: convertNumber  },
		{name: 'MEANFL', convert: convertNumber  },
		{name: 'MEANRZ', convert: convertNumber  },
		{name: 'WETW', convert: convertInteger },
		{name: 'WETWPC', convert: convertNumber  },
		{name: 'WKOM', convert: convertInteger },
		{name: 'WKOMPC', convert: convertNumber  },
		{name: 'WFHZ', convert: convertInteger },
		{name: 'WFHZPC', convert: convertNumber  },
		{name: 'WOFEN', convert: convertInteger },
		{name: 'WOFENPC', convert: convertNumber  },
		{name: 'WOWC', convert: convertInteger },
		{name: 'WOWCPC', convert: convertNumber  },
		{name: 'WBAUJ1PC', convert: convertNumber  },
		{name: 'WBAUJ2PC', convert: convertNumber  },
		{name: 'WBAUJ3PC', convert: convertNumber  }
	],
	hideWarning: function (properties) {
		return true;
	}
});

//NORDEN DATEN

var result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Baufertigstellungen_2011_odc.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'GebaeudeInsgesamt',
			newName: 'NBAUGEBS',
			convert: convertInteger
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());

result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Preise_Staedte ueber 20000 Einwohner.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'Whg_Miete_Q2_2008',
			newName: 'NPREMIETE',
			convert: convertNumber
		},
		{
			name: 'Whg_Miete_Q2_Entwicklung',
			newName: 'NPREMIETEE',
			convert: convertNumber
		},
		{
			name: 'Haus_Kauf_Q2_2013',
			newName: 'NPREKAUF',
			convert: convertPointedInteger
		},
		{
			name: 'Haus_Kauf_Q2_2013_Entwicklung',
			newName: 'NPREKAUFEN',
			convert: convertNumber
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());

result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Einbrueche-Opendatacity.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'Wohnungseinbruch',
			newName: 'NBRUCH',
			convert: convertInteger
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());

result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/erholungsflaechen.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'Erholungsflaeche',
			newName: 'NFLAERH',
			convert: convertInteger
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());

result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/NDR DDJ Auswertung Pendlersaldo 2011.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'Auspendler',
			newName: 'NPENAUS',
			convert: convertPointedInteger
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());

result = geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Auswertung Baulandverkaeufe 2001-2011.csv'),
	myField: 'AGS',
	foreignField: foreignFieldAGS,
	addFields: [
		{
			name: 'STEIG2001',
			newName: 'NSTEIG2001',
			convert: convertNumber
		},
		{
			name: 'KAUF2011',
			newName: 'NKAUF2011',
			convert: convertNumber
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateID);
console.log('      Import:', result.done, ' von ', result.linecount, '; Total:', geojson.count());


/*
 Jetzt werden die Werte verarbeitet.
 "id": Gibt die Karte an, die z.B. in "zensus001" übersetzt wird.
 "title": ist der Titel.
 "value": Nimmt die Eingabewerte und rechnet sie um. Kann der Name einer Spalte sein,
 oder eine Funktion, die den Wert berechnet.
 "gradient": will ein Array von 6stelligen hexadezimalen Strings.

 ggf. können min- und max-Werte festgelegt werden, wenn man sie nicht automatisch berechnet haben möchte.
 */
geojson.setFields(8 * 8, [
	{
		id: '200',
		title: 'Altersverteilung - Anteil der unter 18-Jährigen in %',
		value: function (p) {
			return 100 * p.ALTER_1 / p.EWZ
		},
		gradient: gGelbRot
	},
	{
		id: '201',
		title: 'Altersverteilung - Anteil der 18 bis 29-Jährigen in %',
		value: function (p) {
			return 100 * p.ALTER_2 / p.EWZ
		},
		gradient: gGelbRot
	},
	{
		id: '202',
		title: 'Altersverteilung - Anteil der 30 bis 49-Jährigen in %',
		value: function (p) {
			return 100 * p.ALTER_3 / p.EWZ
		},
		gradient: gGelbRot
	},
	{
		id: '203',
		title: 'Altersverteilung - Anteil der 50 bis 64-Jährigen in %',
		value: function (p) {
			return 100 * p.ALTER_4 / p.EWZ
		},
		gradient: gGelbRot
	},
	{
		id: '204',
		title: 'Altersverteilung - Anteil der 65+ in %',
		value: function (p) {
			return 100 * p.ALTER_5 / p.EWZ
		},
		gradient: gGelbRot
	},
	{
		id: '205',
		title: 'Frauenanteil - Anteil in %',
		value: function (p) {
			return 100 * p.EW_W / p.EWZ
		},
		gradient: gViolettGruen,
		min: 45,
		max: 55
	},
	{
		id: '206',
		title: 'Ausländeranteil - Anteil in %',
		value: function (p) {
			return 100 * p.EW_A / p.EWZ
		},
		gradient: gWeissBlau
	},
	{
		id: '207',
		title: 'Durchschnittliche Wohnfläche pro Einwohner in m²',
		value: function (p) {
			return p.MEANFL * p.WWOGEB / p.EWZ
		},
		gradient: gWeissBlau
	},
	{
		id: '208',
		title: 'Durchschnittliche Wohnfläche pro Wohnung in m²',
		value: function (p) {
			return p.MEANFL
		},
		gradient: gWeissGruen
	},
	{
		id: '209',
		title: 'Anteil der Wohnungen ohne Bad und WC',
		value: 'WOWCPC',
		gradient: gWeissRot
	},
	{
		id: '210',
		title: 'Anteil der leer stehenden Wohnungen',
		value: 'LEQ',
		gradient: gWeissRot
	},
	{
		id: '211',
		title: 'Anteil der vom Eigentümer bewohnten Wohnungen',
		value: 'ETQ',
		gradient: gWeissBlau
	},
	{
		id: '212',
		title: 'Anteil der Wohngebäude, die vor 1919 gebaut wurden, in %',
		value: function (p) {
			return p.BAUJ1PC
		},
		gradient: gWeissGruen
	},
	{
		id: '213',
		title: 'Anteil der Wohngebäude, die von 1950 bis 1969 gebaut wurden, in %',
		value: function (p) {
			return p.BAUJ2PC
		},
		gradient: gWeissGruen
	},
	{
		id: '214',
		title: 'Anteil der Wohngebäude, die nach 2000 gebaut wurden, in %',
		value: function (p) {
			return p.BAUJ3PC
		},
		gradient: gWeissGruen
	},
	{
		id: '215',
		title: 'Anteil der freistehenden Einfamilienhäuser an allen Wohngebäuden in %',
		value: function (p) {
			return p.FREFHPC
		},
		gradient: gWeissBlau
	},


	{
		id: '216',
		title: 'Baufertigstellungen 2011',
		value: function (p) {
			return p.NBAUGEBS
		},
		gradient: gWeissGruen
	},
//KREISE!!	{
//		id: '217',
//		title: 'Steigerungsraten im Vergleich zu 2001 in Prozent',
//		value: function (p) {
//			return p.NSTEIG2001
//		},
//		gradient: gWeissBlau
//	},
//	{
//		id: '218',
//		title: 'Durchschnittlicher Kaufwert je qm 2011',
//		value: function (p) {
//			return p.NKAUF2011
//		},
//		gradient: gWeissBlau
//	},
	{
		id: '219',
		title: 'Auspendler',
		value: function (p) {
			return p.NPENAUS
		},
		gradient: gWeissBlau
	},
	{
		id: '220',
		title: 'Anteil Erholungsfläche',
		value: function (p) {
			return p.NFLAERH
		},
		gradient: gWeissGruen
	},
	{
		id: '221',
		title: 'Wohnungseinbrüche',
		value: function (p) {
			return p.NBRUCH
		},
		gradient: gWeissRot
	},
	{
		id: '222',
		title: 'Mietpreise',
		value: function (p) {
			return p.NPREMIETE
		},
		gradient: gWeissBlau
	},
	{
		id: '223',
		title: 'Mietpreisentwicklung',
		value: function (p) {
			return p.NPREMIETEE
		},
		gradient: gWeissBlau
	},
	{
		id: '224',
		title: 'Preise für Eigentumswohnungen/Häuser',
		value: function (p) {
			return p.NPREKAUF
		},
		gradient: gWeissBlau
	},
	{
		id: '225',
		title: 'Entwicklung der Preise für Eigentumswohnungen/Häuser',
		value: function (p) {
			return p.NPREKAUFEN
		},
		gradient: gWeissBlau
	}

]);

//for (nr in [100]) {
var destpath = '../shared/norden';
// Erzeuge eine Vorschau der Karten.
// Der Kartenausschnitt ist hartgecodet, aber es lässt sich zumindest der zoomfaktor angeben.
geojson.generatePreviews(destpath + '/results/previews/zensus%.png', 1);
geojson.generatePreviews(destpath + '/results/huge/zensus%.png', 16);

// hier werden die geojsons erzeugt, die das lokaler-Frontend benötigt
geojson.generateJSONs(destpath + '/results/jsons/zensus%.json');

// Außerdem die Konfigurationsdatei für Mapnik
// Der zweite Parameter gibt das Shape an, dass in der Mapnik-XML referenziert werden soll.
geojson.generateMapniks('./mapnik.norden.template.xml', destpath + '/results/xml/Zensus%.xml', '/home/mapuser/mappy/data/shapes/zensus_nord/gemeinden.shp');

// Anschließend noch die kleinen png-gradient rendern, die rechts unten als Legende eingeblendet werden.
geojson.generateGradients(destpath + '/results/skalen/skala-%.png');

// Zum Schluss soll das neue GeoJSON mit den zusätzlichen Werten gespeichert werden.
geojson.saveGeo(destpath + '/results/shape/gemeinden', true);
// Wenn der 2. Parameter true ist, wird das GeoJSON gleich in ein Shape umgewandelt, das Mapnik benötigt.
// Das Konvertieren wird mit dem Kommandozeilentool "ogr2ogr" durchgeführt. (modules/match.js Zeile 68)
// Aktuell ist die Konvertierung nur für Mac eingerichtet, lässt sich aber auch leicht manuell durchführen.
// Download hier: http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries

//}
console.log('Done');




