
var match = require('./modules/match.js');

var geojson = match.loadGeoJSON('../geojson/gemeinden.json');

var convertInteger = function (v) { return parseInt(v, 10) };
var convertNumber  = function (v) { return parseFloat(v) };



/*
geojson.match({
	data:match.loadCSV('./2010-12-31/31122010_Auszug_GV_sauber.csv'),
	myField:'RS_ALT',
	foreignField:'GEM_KEY',
	addFields:[
		{name:'FLAECHE', convert:convertNumber  },
		{name:'EWZ_ALT', convert:convertInteger }
	],
	hideWarning: function (properties) { return properties.DES.substr(0,12) == 'Gemeindefrei' }
});
*/

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




geojson.generateLokaler({
	nuances: 8*8,
	mapnikFile: './results/gemeinden/xml/Zensus%.xml',
	gradientFile: './results/gemeinden/skalen/skala-%.png',
	shapeFile: '/home/mapuser/mappy/data/shapes/zensus/gemeinden.shp',
	fields:[
		{
			id:'01',
			title:'Altersverteilung - Anteil der 65+ in %',
			value:function (p) { return 100*p.ALTER_5/p.EWZ },
			gradient:gGelbRot
		},
		{
			id:'02',
			title:'Frauenanteil - Anteil in %',
			value:function (p) { return 100*p.EW_W/p.EWZ },
			gradient:gViolettGruen,
			min: 45,
			max: 55
		},
		{
			id:'03',
			title:'Ausländeranteil - Anteil in %',
			value:function (p) { return 100*p.EW_A/p.EWZ },
			gradient:gWeissBlau
		},
		{
			id:'04',
			title:'Anteil der Wohngebäude mit Baujahr vor 1919',
			value:'WBAUJ1PC',
			gradient:gWeissGruen
		},
		{
			id:'05',
			title:'Anteil der Wohngebäude mit Baujahr zwischen 1950-1969',
			value:'WBAUJ2PC',
			gradient:gWeissGruen
		},
		{
			id:'06',
			title:'Anteil der Wohngebäude mit Baujahr nach 2000',
			value:'WBAUJ3PC',
			gradient:gWeissGruen
		},
		{
			id:'07',
			title:'Anteil der leer stehenden Wohnungen',
			value:'LEQ',
			gradient:gWeissRot
		},
		{
			id:'08',
			title:'Anteil der vom Eigentümer bewohnten Wohnungen',
			value:'ETQ',
			gradient:gWeissRot
		},
		{
			id:'09',
			title:'Anteil der Wohnungen ohne Bad und WC',
			value:'WOWCPC',
			gradient:gWeissRot
		},
		{
			id:'10',
			title:'Altersverteilung - Anteil der unter 18-Jährigen in %',
			value:function (p) { return 100*p.ALTER_1/p.EWZ },
			gradient:gGelbRot
		},
		{
			id:'11',
			title:'Altersverteilung - Anteil der 18 bis 29-Jährigen in %',
			value:function (p) { return 100*p.ALTER_2/p.EWZ },
			gradient:gGelbRot
		},
		{
			id:'12',
			title:'Altersverteilung - Anteil der 30 bis 49-Jährigen in %',
			value:function (p) { return 100*p.ALTER_3/p.EWZ },
			gradient:gGelbRot
		},
		{
			id:'13',
			title:'Altersverteilung - Anteil der 50 bis 64-Jährigen in %',
			value:function (p) { return 100*p.ALTER_4/p.EWZ },
			gradient:gGelbRot
		},


		{
			id:'14',
			title:'Einwohner pro Gebäude',
			value:function (p) { return p.EWZ/p.GEB },
			gradient:gWeissBlau
		},
		{
			id:'15',
			title:'Einwohner pro Wohngebäude',
			value:function (p) { return p.EWZ/p.WOGEB },
			gradient:gWeissBlau
		},
		{
			id:'16',
			title:'Einwohner pro Wohnheim',
			value:function (p) { return p.EWZ/p.WOHEIM },
			gradient:gWeissBlau
		},
		{
			id:'17',
			title:'Einwohner pro Einfamilienhäuser',
			value:function (p) { return p.EWZ/p.EFH },
			gradient:gWeissBlau
		},
		{
			id:'18',
			title:'Anteil der Einfamilienhäuser an allen Wohngebäuden in %',
			value:function (p) { return p.EFHPC },
			gradient:gWeissBlau
		},
		{
			id:'19',
			title:'Einwohner pro freistehender Einfamilienhäuser',
			value:function (p) { return p.EWZ/p.FREFH },
			gradient:gWeissBlau
		},
		{
			id:'20',
			title:'Anteil der freistehenden Einfamilienhäuser an allen Wohngebäuden in %',
			value:function (p) { return p.FREFHPC },
			gradient:gWeissBlau
		},
		{
			id:'21',
			title:'Anteil der Wohngebäude, die in Eigentumswohnungen aufgeteilt sind in %',
			value:function (p) { return p.ETWPC },
			gradient:gWeissBlau
		},
		{
			id:'22',
			title:'Anteil der Wohngebäude, die Kommune oder kommunalen Wohnungsunternehmen gehören',
			value:function (p) { return p.KOMPC },
			gradient:gWeissBlau
		},
		{
			id:'23',
			title:'Anteil der Wohngebäude mit Fernheizung',
			value:function (p) { return p.FHZPC },
			gradient:gWeissBlau
		},
		{
			id:'24',
			title:'Anteil der Wohngebäude mit Ofenheizung',
			value:function (p) { return p.OFENPC },
			gradient:gWeissBlau
		},


		{
			id:'25',
			title:'Anteil der Wohngebäude, die vor 1919 gebaut wurden, in %',
			value:function (p) { return p.BAUJ1PC },
			gradient:gWeissBlau
		},
		{
			id:'26',
			title:'Anteil der Wohngebäude, die von 1950 bis 1969 gebaut wurden, in %',
			value:function (p) { return p.BAUJ2PC },
			gradient:gWeissBlau
		},
		{
			id:'27',
			title:'Anteil der Wohngebäude, die nach 2000 gebaut wurden, in %',
			value:function (p) { return p.BAUJ3PC },
			gradient:gWeissBlau
		},


		{
			id:'28',
			title:'Einwohner pro Wohnung',
			value:function (p) { return p.EWZ/p.WHG },
			gradient:gWeissBlau
		},
		{
			id:'29',
			title:'Anteil der Wohnungen in Wohnheimen in %',
			value:function (p) { return 100*p.WWOHEIM/p.WHG },
			gradient:gWeissBlau
		},
		{
			id:'30',
			title:'Anteil der Wohnungen in bewohnten Unterkünften in %',
			value:function (p) { return 100*p.WBEWUK/p.WHG },
			gradient:gWeissBlau
		},



		{
			id:'31',
			title:'Durchschnittliche Wohnfläche pro Wohnung in m²',
			value:function (p) { return p.MEANFL },
			gradient:gWeissBlau
		},
		{
			id:'32',
			title:'Durchschnittliche Raumzahl pro Wohnung²',
			value:function (p) { return p.MEANRZ },
			gradient:gWeissBlau
		},


		{
			id:'33',
			title:'Durchschnittliche Anzahl der Wohnungen in Gebäude',
			value:function (p) { return p.WWOGEB/p.GEB },
			gradient:gWeissBlau
		},
		{
			id:'34',
			title:'Durchschnittliche Anzahl der Wohnungen in Wohngebäude',
			value:function (p) { return p.WWOGEB/p.WOGEB },
			gradient:gWeissBlau
		},
		{
			id:'35',
			title:'Durchschnittliche Anzahl der Wohnungen in Wohnheimen',
			value:function (p) { return p.WWOHEIM/p.WOHEIM },
			gradient:gWeissBlau
		},
		{
			id:'36',
			title:'Durchschnittliche Anzahl der Wohnungen in bewohnte Unterkünfte',
			value:function (p) { return p.WBEWUK/p.BEWUK },
			gradient:gWeissBlau
		},


		{
			id:'37',
			title:'Anteil der Wohnungen in Wohngebäuden, die in Eigentumswohnungen aufgeteilt sind, in %',
			value:function (p) { return p.WETWPC },
			gradient:gWeissBlau
		},
		{
			id:'38',
			title:'Anteil der Wohnungen in Wohngebäuden, die Kommunen oder kommunalen Wohnungsunternehmen gehören, in %',
			value:function (p) { return p.WKOMPC },
			gradient:gWeissBlau
		},
		{
			id:'39',
			title:'Anteil der Wohnungen mit Fernheizung in %',
			value:function (p) { return p.WFHZPC },
			gradient:gWeissBlau
		},
		{
			id:'40',
			title:'Anteil der Wohnungen mit Ofenheizung in %',
			value:function (p) { return p.WOFENPC },
			gradient:gWeissBlau
		},

		{
			id:'41',
			title:'Durchschnittliche Wohnfläche pro Einwohner in m²',
			value:function (p) { return p.MEANFL*p.WWOGEB/p.EWZ },
			gradient:gWeissBlau
		}
	]
});

geojson.saveGeo('./results/gemeinden/shape/gemeinden', true);