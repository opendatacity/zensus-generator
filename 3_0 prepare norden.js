var fs = require('fs');


var reduceMeckPommesMapping = function () {
	console.log('Lese McPom');
	var mp = fs.readFileSync('./geojson/meckpom_mapping.csv', 'utf8').toString().split('\n');
	var mp_mapping = [];
	var mp_mapping_obj_gs = {};
	var mp_mapping_obj_rs = {};
	mp.forEach(function (line) {
			var fields = line.split(';');
			if (fields.length == 4) {
				var obj = {
					"GS_neu": parseInt(fields[0].replace(/ /g, ''), 10),
					"GS_alt": parseInt(fields[1].replace(/ /g, ''), 10),
					"Name_neu": fields[2],
					"Name_alt": fields[3]
				};

				var gs = obj["GS_alt"].toString();
				var gs_new = obj["GS_neu"].toString();
				if ((mp_mapping_obj_gs[gs]) && (mp_mapping_obj_gs[gs] != gs_new)) {
					console.log('warning, possibly wrong AGS mapping ahead', gs, '->' + gs_new, '&', mp_mapping_obj_gs[gs], '->' + gs_new);
				}
				mp_mapping_obj_gs[gs] = gs_new;


				var rs = obj["GS_alt"].toString().substr(0, 5);
				var rs_new = obj["GS_neu"].toString().substr(0, 5);
				if ((mp_mapping_obj_rs[rs]) && (mp_mapping_obj_rs[rs] != rs_new)) {
					console.log('warning, possibly wrong RS mapping ahead', rs, '->' + rs_new, '&', mp_mapping_obj_rs[rs], '->' + rs_new);
				}
				mp_mapping_obj_rs[rs] = rs_new;
				mp_mapping.push(obj);
			}
		}
	);
	console.log('Schreibe McPom');
	fs.writeFileSync('./geojson/meckpom_mapping.json', JSON.stringify(mp_mapping, null, "\t"), 'utf8');
	fs.writeFileSync('./geojson/meckpom_mapping_obj_gs.json', JSON.stringify(mp_mapping_obj_gs), 'utf8');
	fs.writeFileSync('./geojson/meckpom_mapping_obj_rs.json', JSON.stringify(mp_mapping_obj_rs), 'utf8');
};

var reduceGeoJson = function (source, dest) {
	console.log('Lese GeoJSON ' + source);
	var regions = fs.readFileSync(source, 'utf8');
	regions = JSON.parse(regions);
	regions.features = regions.features.filter(function (feature) {
		var bundesland = feature.properties.RS[0] + feature.properties.RS[1];
		return (feature.properties.RS) && (['01', '02', '03', '04', '13'].indexOf(bundesland) >= 0);
	});
	console.log('Schreibe GeoJSON');
	fs.writeFileSync(dest, JSON.stringify(regions), 'utf8');
};

reduceGeoJson('./geojson/gemeinden.json', './geojson/gemeinden_norden.json');
reduceGeoJson('./geojson/kreise.json', './geojson/kreise_norden.json');
reduceMeckPommesMapping();

console.log('Done <3');



