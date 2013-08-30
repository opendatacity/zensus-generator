var fs = require('fs');



var reduceMeckPommesMapping = function () {
	console.log('Lese McPom');
	var mp = fs.readFileSync('./geojson/meckpom_mapping.csv', 'utf8').toString().split('\n');
	var mp_mapping = [];
	var mp_mapping_obj = {};
	mp.forEach(function (line) {
			var fields = line.split(';');
			if (fields.length == 4) {
				var obj = {
					"GS_neu": parseInt(fields[0].replace(/ /g, ''), 10),
					"GS_alt": parseInt(fields[1].replace(/ /g, ''), 10),
					"Name_neu": fields[2],
					"Name_alt": fields[3]
				};
				mp_mapping_obj[obj["GS_alt"]] = obj["GS_neu"];
				mp_mapping.push(obj);
//			console.log(line);
			}
		}
	);
	console.log('Schreibe McPom');
	fs.writeFileSync('./geojson/meckpom_mapping.json', JSON.stringify(mp_mapping, null, "\t"), 'utf8');
	fs.writeFileSync('./geojson/meckpom_mapping_obj.json', JSON.stringify(mp_mapping_obj), 'utf8');
};

var reduceGeoJson = function () {
	console.log('Lese GeoJSON');
	var regions = fs.readFileSync('./geojson/gemeinden.json', 'utf8');
	regions = JSON.parse(regions);
	regions.features = regions.features.filter(function (feature) {
		var bundesland = feature.properties.RS[0] + feature.properties.RS[1];
		return (feature.properties.RS) && (['01', '02', '03', '13'].indexOf(bundesland) >= 0);
	});
	console.log('Schreibe GeoJSON');
	fs.writeFileSync('./geojson/gemeinden_norden.json', JSON.stringify(regions), 'utf8');
};

reduceGeoJson();
reduceMeckPommesMapping();

console.log('Done <3');



