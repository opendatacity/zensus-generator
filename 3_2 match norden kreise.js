var match = require('./modules/match.js');
var fs = require('fs');

var geojson = match.loadGeoJSON('./geojson/kreise_norden.json');

//Lade Mapping für Mecklenburg-Vorpommern GSA-Umbennenung
var mp_mapping_rs = JSON.parse(fs.readFileSync('./geojson/meckpom_mapping_obj_rs.json', 'utf8'));


var convertInteger = function (v) {
	return parseInt(v, 10)
};
var convertNumber = function (v) {
	return parseFloat(v)
};
var convertNumberTsdDe = function (v) {
	return parseFloat(v.replace(/\./g, '').replace(/\,/, '.')) * 1000
};
var convertPointedInteger = function (v) {
	v = v.replace(/\./g, '');
	return parseInt(v, 10)
};


geojson.match({
	data: match.loadCSV('../shared/wikipedia/kreise_wiki.csv'),
	myField: 'RAU_RS',
	foreignField: 'RAU_RS,C,12',
	addFields: [
		{
			name: 'LINK,C,65',
			newName: 'wiki',
			convert: function (v) {
				if (v == 'none') return undefined;
				if (v.substr(0, 31) == 'http://de.m.wikipedia.org/wiki/') return v.substr(31);
				if (v.substr(0, 29) == 'http://de.wikipedia.org/wiki/')   return v.substr(29);
				console.error('convert-Fehler: ' + v);
			}
		}
	],
	hideWarning: function (properties) {
		return properties.DES.substr(0, 12) == 'Gemeindefrei'
	}
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/bevoelkerungsfort_zip/ZENSUS_BFS_ALTERSKLASSEN_V1_28Mai2013.csv'),
	myField: 'RS',
	foreignField: 'AGS',
	addFields: [
		{ name: 'Zensus_EWZ', convert: convertNumberTsdDe },
		{ name: 'Zensus_gebjahr_1', convert: convertNumberTsdDe },
		{ name: 'Zensus_gebjahr_2', convert: convertNumberTsdDe },
		{ name: 'Zensus_gebjahr_3', convert: convertNumberTsdDe },
		{ name: 'Zensus_gebjahr_4', convert: convertNumberTsdDe },
		{ name: 'Zensus_gebjahr_5', convert: convertNumberTsdDe },
		{ name: 'BFS_EWZ', convert: convertNumberTsdDe },
		{ name: 'BFS_gebjahr_1', convert: convertNumberTsdDe },
		{ name: 'BFS_gebjahr_2', convert: convertNumberTsdDe },
		{ name: 'BFS_gebjahr_3', convert: convertNumberTsdDe },
		{ name: 'BFS_gebjahr_4', convert: convertNumberTsdDe },
		{ name: 'BFS_gebjahr_5', convert: convertNumberTsdDe }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/bevoelkerungsfort_zip/ZENSUS_BFS_GESCHLECHT_V1_28Mai2013.csv'),
	myField: 'RS',
	foreignField: 'AGS',
	addFields: [
		{ name: 'Zensus_EWZ', convert: convertNumberTsdDe },
		{ name: 'Zensus_EW_M', convert: convertNumberTsdDe },
		{ name: 'Zensus_EW_W', convert: convertNumberTsdDe },
		{ name: 'BFS_EWZ', convert: convertNumberTsdDe },
		{ name: 'BFS_EW_M', convert: convertNumberTsdDe },
		{ name: 'BFS_EW_W', convert: convertNumberTsdDe }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Ausbildungsabschluss_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'A15GES', convert: convertInteger },
		{ name: 'A15DE', convert: convertInteger },
		{ name: 'A15AU', convert: convertInteger },
		{ name: 'OBERAB', convert: convertInteger },
		{ name: 'OBERABDE', convert: convertInteger },
		{ name: 'OBERABAU', convert: convertInteger },
		{ name: 'BERAB', convert: convertInteger },
		{ name: 'BERABDE', convert: convertInteger },
		{ name: 'BERABAU', convert: convertInteger },
		{ name: 'HOCHAB', convert: convertInteger },
		{ name: 'HOCHABDE', convert: convertInteger },
		{ name: 'HOCHABAU', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Ausbildungsabschluss_männlich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'A15GES', newName: 'A15GESM', convert: convertInteger },
		{ name: 'A15DE', newName: 'A15DEM', convert: convertInteger },
		{ name: 'A15AU', newName: 'A15AUM', convert: convertInteger },
		{ name: 'OBERAB', newName: 'OBERABM', convert: convertInteger },
		{ name: 'OBERABDE', newName: 'OBERABDEM', convert: convertInteger },
		{ name: 'OBERABAU', newName: 'OBERABAUM', convert: convertInteger },
		{ name: 'BERAB', newName: 'BERABM', convert: convertInteger },
		{ name: 'BERABDE', newName: 'BERABDEM', convert: convertInteger },
		{ name: 'BERABAU', newName: 'BERABAUM', convert: convertInteger },
		{ name: 'HOCHAB', newName: 'HOCHABM', convert: convertInteger },
		{ name: 'HOCHABDE', newName: 'HOCHABDEM', convert: convertInteger },
		{ name: 'HOCHABAU', newName: 'HOCHABAUM', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Ausbildungsabschluss_weiblich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'A15GES', newName: 'A15GESW', convert: convertInteger },
		{ name: 'A15DE', newName: 'A15DEW', convert: convertInteger },
		{ name: 'A15AU', newName: 'A15AUW', convert: convertInteger },
		{ name: 'OBERAB', newName: 'OBERABW', convert: convertInteger },
		{ name: 'OBERABDE', newName: 'OBERABDEW', convert: convertInteger },
		{ name: 'OBERABAU', newName: 'OBERABAUW', convert: convertInteger },
		{ name: 'BERAB', newName: 'BERABW', convert: convertInteger },
		{ name: 'BERABDE', newName: 'BERABDEW', convert: convertInteger },
		{ name: 'BERABAU', newName: 'BERABAUW', convert: convertInteger },
		{ name: 'HOCHAB', newName: 'HOCHABW', convert: convertInteger },
		{ name: 'HOCHABDE', newName: 'HOCHABDEW', convert: convertInteger },
		{ name: 'HOCHABAU', newName: 'HOCHABAUW', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Erwerbsstatus_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEV', convert: convertInteger },
		{ name: 'ERWERBST', newName: 'ERWERBST', convert: convertInteger },
		{ name: 'ERWERBSL', newName: 'ERWERBSL', convert: convertInteger },
		{ name: 'NERWERB', newName: 'NERWERB', convert: convertInteger },
		{ name: 'ERW18', newName: 'ERW18', convert: convertInteger },
		{ name: 'ERW18_29', newName: 'ERW18_29', convert: convertInteger },
		{ name: 'ERW30_49', newName: 'ERW30_49', convert: convertInteger },
		{ name: 'ERW50_64', newName: 'ERW50_64', convert: convertInteger },
		{ name: 'ERW65', newName: 'ERW65', convert: convertInteger },
		{ name: 'ERWOAUS', newName: 'ERWOAUS', convert: convertInteger },
		{ name: 'ERWBERUF', newName: 'ERWBERUF', convert: convertInteger },
		{ name: 'ERWHOCH', newName: 'ERWHOCH', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Erwerbsstatus_männlich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVM', convert: convertInteger },
		{ name: 'ERWERBST', newName: 'ERWERBSTM', convert: convertInteger },
		{ name: 'ERWERBSL', newName: 'ERWERBSLM', convert: convertInteger },
		{ name: 'NERWERB', newName: 'NERWERBM', convert: convertInteger },
		{ name: 'ERW18', newName: 'ERW18M', convert: convertInteger },
		{ name: 'ERW18_29', newName: 'ERW18_29M', convert: convertInteger },
		{ name: 'ERW30_49', newName: 'ERW30_49M', convert: convertInteger },
		{ name: 'ERW50_64', newName: 'ERW50_64M', convert: convertInteger },
		{ name: 'ERW65', newName: 'ERW65M', convert: convertInteger },
		{ name: 'ERWOAUS', newName: 'ERWOAUSM', convert: convertInteger },
		{ name: 'ERWBERUF', newName: 'ERWBERUFM', convert: convertInteger },
		{ name: 'ERWHOCH', newName: 'ERWHOCHM', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Erwerbsstatus_weiblich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVW', convert: convertInteger },
		{ name: 'ERWERBST', newName: 'ERWERBSTW', convert: convertInteger },
		{ name: 'ERWERBSL', newName: 'ERWERBSLW', convert: convertInteger },
		{ name: 'NERWERB', newName: 'NERWERBW', convert: convertInteger },
		{ name: 'ERW18', newName: 'ERW18W', convert: convertInteger },
		{ name: 'ERW18_29', newName: 'ERW18_29W', convert: convertInteger },
		{ name: 'ERW30_49', newName: 'ERW30_49W', convert: convertInteger },
		{ name: 'ERW50_64', newName: 'ERW50_64W', convert: convertInteger },
		{ name: 'ERW65', newName: 'ERW65W', convert: convertInteger },
		{ name: 'ERWOAUS', newName: 'ERWOAUSW', convert: convertInteger },
		{ name: 'ERWBERUF', newName: 'ERWBERUFW', convert: convertInteger },
		{ name: 'ERWHOCH', newName: 'ERWHOCHW', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MHG_Alter_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEV', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIG', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIG', convert: convertInteger },
		{ name: 'MIG18', newName: 'MIG18', convert: convertInteger },
		{ name: 'MIG18_29', newName: 'MIG18_29', convert: convertInteger },
		{ name: 'MIG30_49', newName: 'MIG30_49', convert: convertInteger },
		{ name: 'MIG50_64', newName: 'MIG50_64', convert: convertInteger },
		{ name: 'MIG65', newName: 'MIG65', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MHG_Alter_männlich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVM', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIGM', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIGM', convert: convertInteger },
		{ name: 'MIG18', newName: 'MIG18M', convert: convertInteger },
		{ name: 'MIG18_29', newName: 'MIG18_29M', convert: convertInteger },
		{ name: 'MIG30_49', newName: 'MIG30_49M', convert: convertInteger },
		{ name: 'MIG50_64', newName: 'MIG50_64M', convert: convertInteger },
		{ name: 'MIG65', newName: 'MIG65M', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MHG_Alter_weiblich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVW', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIGW', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIGW', convert: convertInteger },
		{ name: 'MIG18', newName: 'MIG18W', convert: convertInteger },
		{ name: 'MIG18_29', newName: 'MIG18_29W', convert: convertInteger },
		{ name: 'MIG30_49', newName: 'MIG30_49W', convert: convertInteger },
		{ name: 'MIG50_64', newName: 'MIG50_64W', convert: convertInteger },
		{ name: 'MIG65', newName: 'MIG65W', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MIG-Erfahr_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEV', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIG', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIG', convert: convertInteger },
		{ name: 'BEVMEMIG', newName: 'BEVMEMIG', convert: convertInteger },
		{ name: 'BEVOEMIG', newName: 'BEVOEMIG', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MIG-Erfahr_männlich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVM', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIGM', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIGM', convert: convertInteger },
		{ name: 'BEVMEMIG', newName: 'BEVMEMIGM', convert: convertInteger },
		{ name: 'BEVOEMIG', newName: 'BEVOEMIGM', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_MIG-Erfahr_weiblich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', newName: 'BEVW', convert: convertInteger },
		{ name: 'BEVOMIG', newName: 'BEVOMIGW', convert: convertInteger },
		{ name: 'BEVMMIG', newName: 'BEVMMIGW', convert: convertInteger },
		{ name: 'BEVMEMIG', newName: 'BEVMEMIGW', convert: convertInteger },
		{ name: 'BEVOEMIG', newName: 'BEVOEMIGW', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Schulabschluss_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'GESGES', newName: 'GESGES', convert: convertInteger },
		{ name: 'GESDE', newName: 'GESDE', convert: convertInteger },
		{ name: 'GESAU', newName: 'GESAU', convert: convertInteger },
		{ name: 'OSAB', newName: 'OSAB', convert: convertInteger },
		{ name: 'OSABDE', newName: 'OSABDE', convert: convertInteger },
		{ name: 'OSABAU', newName: 'OSABAU', convert: convertInteger },
		{ name: 'HAUAB', newName: 'HAUAB', convert: convertInteger },
		{ name: 'HAUABDE', newName: 'HAUABDE', convert: convertInteger },
		{ name: 'HAUABAU', newName: 'HAUABAU', convert: convertInteger },
		{ name: 'MITRAB', newName: 'MITRAB', convert: convertInteger },
		{ name: 'MITRABDE', newName: 'MITRABDE', convert: convertInteger },
		{ name: 'MITRABAU', newName: 'MITRABAU', convert: convertInteger },
		{ name: 'HOSAB', newName: 'HOSAB', convert: convertInteger },
		{ name: 'HOSABDE', newName: 'HOSABDE', convert: convertInteger },
		{ name: 'HOSABAU', newName: 'HOSABAU', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Schulabschluss_männlich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'GESGES', newName: 'GESGESM', convert: convertInteger },
		{ name: 'GESDE', newName: 'GESDEM', convert: convertInteger },
		{ name: 'GESAU', newName: 'GESAUM', convert: convertInteger },
		{ name: 'OSAB', newName: 'OSABM', convert: convertInteger },
		{ name: 'OSABDE', newName: 'OSABDEM', convert: convertInteger },
		{ name: 'OSABAU', newName: 'OSABAUM', convert: convertInteger },
		{ name: 'HAUAB', newName: 'HAUABM', convert: convertInteger },
		{ name: 'HAUABDE', newName: 'HAUABDEM', convert: convertInteger },
		{ name: 'HAUABAU', newName: 'HAUABAUM', convert: convertInteger },
		{ name: 'MITRAB', newName: 'MITRABM', convert: convertInteger },
		{ name: 'MITRABDE', newName: 'MITRABDEM', convert: convertInteger },
		{ name: 'MITRABAU', newName: 'MITRABAUM', convert: convertInteger },
		{ name: 'HOSAB', newName: 'HOSABM', convert: convertInteger },
		{ name: 'HOSABDE', newName: 'HOSABDEM', convert: convertInteger },
		{ name: 'HOSABAU', newName: 'HOSABAUM', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Schulabschluss_weiblich_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'GESGES', newName: 'GESGESW', convert: convertInteger },
		{ name: 'GESDE', newName: 'GESDEW', convert: convertInteger },
		{ name: 'GESAU', newName: 'GESAUW', convert: convertInteger },
		{ name: 'OSAB', newName: 'OSABW', convert: convertInteger },
		{ name: 'OSABDE', newName: 'OSABDEW', convert: convertInteger },
		{ name: 'OSABAU', newName: 'OSABAUW', convert: convertInteger },
		{ name: 'HAUAB', newName: 'HAUABW', convert: convertInteger },
		{ name: 'HAUABDE', newName: 'HAUABDEW', convert: convertInteger },
		{ name: 'HAUABAU', newName: 'HAUABAUW', convert: convertInteger },
		{ name: 'MITRAB', newName: 'MITRABW', convert: convertInteger },
		{ name: 'MITRABDE', newName: 'MITRABDEW', convert: convertInteger },
		{ name: 'MITRABAU', newName: 'MITRABAUW', convert: convertInteger },
		{ name: 'HOSAB', newName: 'HOSABW', convert: convertInteger },
		{ name: 'HOSABDE', newName: 'HOSABDEW', convert: convertInteger },
		{ name: 'HOSABAU', newName: 'HOSABAUW', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/soziodemo_zip/Bevölkerung_nach_Religion_2011_V1_28Mai2013.csv'),
	myField: function (p) {
		return '' + parseInt(p.RS, 10);
	},
	foreignField: 'AGS',
	addFields: [
		{ name: 'BEV', convert: convertInteger },
		{ name: 'CHRIST', convert: convertInteger },
		{ name: 'RKATH', convert: convertInteger },
		{ name: 'EVANG', convert: convertInteger },
		{ name: 'SONST', convert: convertInteger },
		{ name: 'KEINE', convert: convertInteger },
		{ name: 'OANGABE', convert: convertInteger }
	]
});

geojson.match({
	data: match.loadCSV('../shared/Zensusdaten/demo_zip/Zensus_Demographie_V1_28Mai2013.csv'),
	myField: 'RS',
	foreignField: 'AGS',
	addFields: [
		{ name: 'EWZ', convert: convertInteger }
	]  ,
	hideWarning: function (properties) {
		//console.log(properties.AGS+' : '+ properties.GEN);
		return true;
	}
});

var translateRS = function (id) {
	if ((id[0] == 1) && (id[1] == 3)) {
		if (!mp_mapping_rs[id]) {
			console.log('Missing Mapping: ' + id);
		}
		return mp_mapping_rs[id];
	}
	return id;
};

var foreignFieldAGSShort = function (entry) {
	return entry['AGS'].substr(0, 5);
};

var foreignFieldRSShort = function (entry) {
	return entry['RS'].trim().substr(0, 5);
};

var foreignFieldRS = function (entry) {
	return entry['RS'].trim().substr(0, 5);
};

geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Auswertung Baulandverkaeufe 2001-2011.csv'),
	myField: 'RS',
	foreignField: foreignFieldRSShort,
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
		console.log(properties.AGS + ' : ' + properties.GEN);
		return true;
	}
});

geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/Arbeitslosigkeit August 2013.csv'),
	myField: 'RS',
	foreignField: foreignFieldRS,
	addFields: [
		{
			name: 'Arbeitslosenquote',
			newName: 'NARBQU',
			convert: convertNumber
		}
	],
	hideWarning: function (properties) {
		return true;
	}
}, translateRS);

geojson.match({
	data: match.loadCSV('../shared/norden/data-csv/durschnittsmieten 2012 nach Kreisen.csv'),
	myField: 'RS',
	foreignField: foreignFieldRS,
	addFields: [
		{
			name: 'NMIE12',
			newName: 'NMIE12',
			convert: convertNumber
		}
	],
	hideWarning: function (properties) {
		return true;
	}
});

var gGelbRot = ['DDDDDD', 'FFFFE5', 'FFF7BC', 'FEE391', 'FEC44F', 'FE9929', 'EC7014', 'CC4C02', '993404', '662506'];
var gViolettGruen = ['F7F7F7', '1b7837', '5aae61', 'a6dba0', 'd9f0d3', 'f7f7f7', 'e7d4e8', 'c2a5cf', '9970ab', '762a83'];
var gWeissBlau = ['FBFBFB', 'FFF7FB', 'ECE7F2', 'D0D1E6', 'A6BDDB', '74A9CF', '3690C0', '0570B0', '045A8D', '023858'];
var gWeissGruen = ['FBFBFB', 'f7fcf5', 'e5f5e0', 'c7e9c0', 'a1d99b', '74c476', '41ab5d', '238b45', '006d2c', '00441b'];
var gWeissRot = ['FBFBFB', 'fff5f0', 'fee0d2', 'fcbba1', 'fc9272', 'fb6a4a', 'ef3b2c', 'cb181d', 'a50f15', '67000d'];


geojson.setFields(8 * 8, [

	{
		id: '217',
		title: 'Baulandverkaeufe Steigerungsraten im Vergleich zu 2001 in Prozent',
		value: function (p) {
			return p.NSTEIG2001
		},
		gradient: gWeissBlau
	},
	{
		id: '218',
		title: 'Baulandverkaeufe Durchschnittlicher Kaufwert je qm 2011',
		value: function (p) {
			return p.NKAUF2011
		},
		gradient: gWeissBlau
	},

	{
		id: '226',
		title: 'Arbeitslosenquote',
		value: function (p) {
			return p.NARBQU
		},
		gradient: gWeissRot
	},
	{
		id: '227',
		title: 'Miete 2012 in €/m²',
		value: function (p) {
			return p.NMIE12
		},
		gradient: gWeissBlau
	}
]);

var destpath = '../shared/norden';
geojson.generateJSONs(destpath + '/results/jsons/zensus%.json');
geojson.generatePreviews(destpath + '/results/previews/zensus%.png', 1);
geojson.generatePreviews(destpath + '/results/huge/zensus%.png', 16);
geojson.generateGradients(destpath + '/results/skalen/skala-%.png');
geojson.generateMapniks('./mapnik.norden.template.xml', destpath + '/results/xml/', '/zensus_nord/landkreise.shp');
geojson.saveGeo(destpath + '/results/shape/landkreise', true);

console.log('Done <3');