
var match = require('./modules/match.js');

var geojson = match.loadGeoJSON('../geojson/gemeinden.json');

var convertInteger = function (v) { return parseInt(v, 10) };
var convertNumber  = function (v) { return parseFloat(v) };

geojson.match({
	data:match.loadCSV('../shared/wikipedia/Gemeinden_wikipedia.csv'),
	myField:'RAU_RS',
	foreignField:'RS_ALT,C,20',
	addFields:[
		{
			name:'LINK,C,65',
			newName: 'wiki',
			convert:function (v) {
				if (v == 'none') return undefined;
				if (v.substr(0, 31) == 'http://de.m.wikipedia.org/wiki/') return v.substr(31);
				console.log(v);
			}
		}
	],
	hideWarning: function (properties) { return properties.DES.substr(0,12) == 'Gemeindefrei' }
});

geojson.match({
	data:match.loadCSV('../shared/Zensusdaten/demo_zip/Zensus_Demographie_V1_28Mai2013.csv'),
	myField:'RAU_RS',
	foreignField:'AGS',
	addFields:[
		{name:'EWZ',     convert:convertInteger },
		{name:'EW_M',    convert:convertInteger },
		{name:'EW_W',    convert:convertInteger },
		{name:'EW_D',    convert:convertInteger },
		{name:'EW_A',    convert:convertInteger },
		{name:'ALTER_1', convert:convertInteger },
		{name:'ALTER_2', convert:convertInteger },
		{name:'ALTER_3', convert:convertInteger },
		{name:'ALTER_4', convert:convertInteger },
		{name:'ALTER_5', convert:convertInteger }
	],
	hideWarning: function (properties) { return properties.DES.substr(0,12) == 'Gemeindefrei' }
});

geojson.match({
	data:match.loadCSV('../shared/Zensusdaten/gwz_zip/Kennzahlen_Gebaeude_und_Wohnungen_2011_V1_28Mai2013.csv'),
	myField:'RAU_RS',
	foreignField:'AGS',
	addFields:[
		{name:'GEB',      convert:convertInteger },
		{name:'WOGEB',    convert:convertInteger },
		{name:'SOGEB',    convert:convertInteger },
		{name:'WOHEIM',   convert:convertInteger },
		{name:'BEWUK',    convert:convertInteger },
		{name:'EFH',      convert:convertInteger },
		{name:'EFHPC',    convert:convertNumber  },
		{name:'FREFH',    convert:convertInteger },
		{name:'FREFHPC',  convert:convertNumber  },
		{name:'ETW',      convert:convertInteger },
		{name:'ETWPC',    convert:convertNumber  },
		{name:'KOM',      convert:convertInteger },
		{name:'KOMPC',    convert:convertNumber  },
		{name:'FHZ',      convert:convertInteger },
		{name:'FHZPC',    convert:convertNumber  },
		{name:'OFEN',     convert:convertInteger },
		{name:'OFENPC',   convert:convertNumber  },
		{name:'BAUJ1PC',  convert:convertNumber  },
		{name:'BAUJ2PC',  convert:convertNumber  },
		{name:'BAUJ3PC',  convert:convertNumber  },
		{name:'WHG',      convert:convertInteger },
		{name:'WWOGEB',   convert:convertInteger },
		{name:'WSOGEB',   convert:convertInteger },
		{name:'WWOHEIM',  convert:convertInteger },
		{name:'WBEWUK',   convert:convertInteger },
		{name:'WEIGEN',   convert:convertInteger },
		{name:'WMIET',    convert:convertInteger },
		{name:'WLEER',    convert:convertInteger },
		{name:'ETQ',      convert:convertNumber  },
		{name:'LEQ',      convert:convertNumber  },
		{name:'MEANFL',   convert:convertNumber  },
		{name:'MEANRZ',   convert:convertNumber  },
		{name:'WETW',     convert:convertInteger },
		{name:'WETWPC',   convert:convertNumber  },
		{name:'WKOM',     convert:convertInteger },
		{name:'WKOMPC',   convert:convertNumber  },
		{name:'WFHZ',     convert:convertInteger },
		{name:'WFHZPC',   convert:convertNumber  },
		{name:'WOFEN',    convert:convertInteger },
		{name:'WOFENPC',  convert:convertNumber  },
		{name:'WOWC',     convert:convertInteger },
		{name:'WOWCPC',   convert:convertNumber  },
		{name:'WBAUJ1PC', convert:convertNumber  },
		{name:'WBAUJ2PC', convert:convertNumber  },
		{name:'WBAUJ3PC', convert:convertNumber  }
	],
	hideWarning: function (properties) { return properties.DES.substr(0,12) == 'Gemeindefrei' }
});

var gGelbRot =      ['DDDDDD','FFFFE5','FFF7BC','FEE391','FEC44F','FE9929','EC7014','CC4C02','993404','662506'];
var gViolettGruen = ['F7F7F7','1b7837','5aae61','a6dba0','d9f0d3','f7f7f7','e7d4e8','c2a5cf','9970ab','762a83'];
var gWeissBlau =    ['FFFFFF','FFF7FB','ECE7F2','D0D1E6','A6BDDB','74A9CF','3690C0','0570B0','045A8D','023858'];
var gWeissGruen =   ['FFFFFF','f7fcf5','e5f5e0','c7e9c0','a1d99b','74c476','41ab5d','238b45','006d2c','00441b'];
var gWeissRot =     ['FFFFFF','fff5f0','fee0d2','fcbba1','fc9272','fb6a4a','ef3b2c','cb181d','a50f15','67000d'];


geojson.setFields(8*8, [
	{
		id:'001',
		title:'Altersverteilung - Anteil der 65+ in %',
		value:function (p) { return 100*p.ALTER_5/p.EWZ },
		gradient:gGelbRot
	},
	{
		id:'002',
		title:'Frauenanteil - Anteil in %',
		value:function (p) { return 100*p.EW_W/p.EWZ },
		gradient:gViolettGruen,
		min: 45,
		max: 55
	},
	{
		id:'003',
		title:'Ausländeranteil - Anteil in %',
		value:function (p) { return 100*p.EW_A/p.EWZ },
		gradient:gWeissBlau
	},
	{
		id:'004',
		title:'Anteil der Whg. in Wohngebäude mit Baujahr vor 1919',
		value:'WBAUJ1PC',
		gradient:gWeissGruen
	},
	{
		id:'005',
		title:'Anteil der Whg. in Wohngebäude mit Baujahr zwischen 1950-1969',
		value:'WBAUJ2PC',
		gradient:gWeissGruen
	},
	{
		id:'006',
		title:'Anteil der Whg. in Wohngebäude mit Baujahr nach 2000',
		value:'WBAUJ3PC',
		gradient:gWeissGruen
	},
	{
		id:'007',
		title:'Anteil der leer stehenden Wohnungen',
		value:'LEQ',
		gradient:gWeissRot
	},
	{
		id:'008',
		title:'Anteil der vom Eigentümer bewohnten Wohnungen',
		value:'ETQ',
		gradient:gWeissBlau
	},
	{
		id:'009',
		title:'Anteil der Wohnungen ohne Bad und WC',
		value:'WOWCPC',
		gradient:gWeissRot
	},
	{
		id:'010',
		title:'Altersverteilung - Anteil der unter 18-Jährigen in %',
		value:function (p) { return 100*p.ALTER_1/p.EWZ },
		gradient:gGelbRot
	},
	{
		id:'011',
		title:'Altersverteilung - Anteil der 18 bis 29-Jährigen in %',
		value:function (p) { return 100*p.ALTER_2/p.EWZ },
		gradient:gGelbRot
	},
	{
		id:'012',
		title:'Altersverteilung - Anteil der 30 bis 49-Jährigen in %',
		value:function (p) { return 100*p.ALTER_3/p.EWZ },
		gradient:gGelbRot
	},
	{
		id:'013',
		title:'Altersverteilung - Anteil der 50 bis 64-Jährigen in %',
		value:function (p) { return 100*p.ALTER_4/p.EWZ },
		gradient:gGelbRot
	},


	{
		id:'014',
		title:'Einwohner pro Gebäude',
		value:function (p) { return p.EWZ/p.GEB },
		gradient:gWeissBlau
	},
	{
		id:'015',
		title:'Einwohner pro Wohngebäude',
		value:function (p) { return p.EWZ/p.WOGEB },
		gradient:gWeissBlau
	},
	{
		id:'018',
		title:'Anteil der Einfamilienhäuser an allen Wohngebäuden in %',
		value:function (p) { return p.EFHPC },
		gradient:gWeissGruen
	},
	{
		id:'020',
		title:'Anteil der freistehenden Einfamilienhäuser an allen Wohngebäuden in %',
		value:function (p) { return p.FREFHPC },
		gradient:gWeissBlau
	},
	{
		id:'021',
		title:'Anteil der Wohngebäude, die in Eigentumswohnungen aufgeteilt sind in %',
		value:function (p) { return p.ETWPC },
		gradient:gWeissGruen
	},
	{
		id:'022',
		title:'Anteil der Wohngebäude, die Kommune oder kommunalen Wohnungsunternehmen gehören',
		value:function (p) { return p.KOMPC },
		gradient:gWeissGruen
	},
	{
		id:'023',
		title:'Anteil der Wohngebäude mit Fernheizung',
		value:function (p) { return p.FHZPC },
		gradient:gWeissRot
	},
	{
		id:'024',
		title:'Anteil der Wohngebäude mit Ofenheizung',
		value:function (p) { return p.OFENPC },
		gradient:gWeissRot
	},


	{
		id:'025',
		title:'Anteil der Wohngebäude, die vor 1919 gebaut wurden, in %',
		value:function (p) { return p.BAUJ1PC },
		gradient:gWeissGruen
	},
	{
		id:'026',
		title:'Anteil der Wohngebäude, die von 1950 bis 1969 gebaut wurden, in %',
		value:function (p) { return p.BAUJ2PC },
		gradient:gWeissGruen
	},
	{
		id:'027',
		title:'Anteil der Wohngebäude, die nach 2000 gebaut wurden, in %',
		value:function (p) { return p.BAUJ3PC },
		gradient:gWeissGruen
	},


	{
		id:'028',
		title:'Einwohner pro Wohnung',
		value:function (p) { return p.EWZ/p.WHG },
		gradient:gWeissBlau
	},
	{
		id:'029',
		title:'Anteil der Wohnungen in Wohnheimen in %',
		value:function (p) { return 100*p.WWOHEIM/p.WHG },
		gradient:gWeissGruen
	},
	{
		id:'030',
		title:'Anteil der Wohnungen in bewohnten Unterkünften in %',
		value:function (p) { return 100*p.WBEWUK/p.WHG },
		gradient:gWeissGruen
	},



	{
		id:'031',
		title:'Durchschnittliche Wohnfläche pro Wohnung in m²',
		value:function (p) { return p.MEANFL },
		gradient:gWeissGruen
	},
	{
		id:'032',
		title:'Durchschnittliche Raumzahl pro Wohnung²',
		value:function (p) { return p.MEANRZ },
		gradient:gWeissGruen
	},



	{
		id:'033',
		title:'Durchschnittliche Anzahl der Wohnungen in Wohngebäude',
		value:function (p) { return p.WWOGEB/p.WOGEB },
		gradient:gWeissGruen
	},



	{
		id:'034',
		title:'Anteil der Wohnungen in Wohngebäuden, die in Eigentumswohnungen aufgeteilt sind, in %',
		value:function (p) { return p.WETWPC },
		gradient:gWeissGruen
	},
	{
		id:'035',
		title:'Anteil der Wohnungen in Wohngebäuden, die Kommunen oder kommunalen Wohnungsunternehmen gehören, in %',
		value:function (p) { return p.WKOMPC },
		gradient:gWeissGruen
	},
	{
		id:'036',
		title:'Anteil der Wohnungen mit Fernheizung in %',
		value:function (p) { return p.WFHZPC },
		gradient:gGelbRot
	},
	{
		id:'037',
		title:'Anteil der Wohnungen mit Ofenheizung in %',
		value:function (p) { return p.WOFENPC },
		gradient:gGelbRot
	},

	{
		id:'038',
		title:'Durchschnittliche Wohnfläche pro Einwohner in m²',
		value:function (p) { return p.MEANFL*p.WWOGEB/p.EWZ },
		gradient:gWeissBlau
	}
]);


geojson.generateJSONs('./results/jsons/zensus%.json');
geojson.generatePreviews('./results/previews/zensus%.png');
geojson.generateGradients('./results/skalen/skala-%.png'),
geojson.generateMapniks('./results/xml/Zensus%.xml', '/home/mapuser/mappy/data/shapes/zensus/gemeinden.shp');


//geojson.saveGeo('./results/shape/gemeinden', true);