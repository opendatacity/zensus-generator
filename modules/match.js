var fs = require('fs');
var exec = require('child_process').exec;

exports.loadGeoJSON = function (filename) {
	var me = this;
	
	console.log('   Lade GeoJSON "'+filename+'"');
	var regions = fs.readFileSync(filename, 'utf8');

	console.log('      Lese GeoJSON');
	regions = JSON.parse(regions);

	me.match = function (options) {
		console.log('   Matching');
		var data = options.data;
		var lut = {};
		data.forEach(function (entry) {
			lut['_'+entry[options.foreignField]] = entry;
		});

		regions.features.forEach(function (region) {
			var id = region.properties[options.myField];
			if (lut['_'+id] === undefined) {
				if (!options.hideWarning || !options.hideWarning(region.properties)) {
					console.warn('id nicht gefunden');
					console.warn(region.properties);
				}
			} else {
				options.addFields.forEach(function (field) {
					var newName = field.newName ? field.newName : field.name;
					var value = field.convert(lut['_'+id][field.name]);
					if (region.properties[newName] !== undefined) {
						var abw = Math.abs(region.properties[newName]/value - 1);
						if (abw > 0.002) {
							console.warn('Wert gibt\'s schon!');
							console.warn(region.properties);
							console.warn(newName);
							console.warn(region.properties[newName]);
							console.warn(field.name);
							console.warn(value);
						}
					}
					region.properties[newName] = value;
				})
			}
		})
	}

	me.saveGeo = function (filename, convertShape) {
		var json = JSON.stringify(regions/*, null, '\t'*/);
		console.log('   Erstelle GeoJSON');
		console.log('      Speichere GeoJSON');
		ensureFolder(filename);
		fs.writeFileSync(filename+'.geojson', json, 'utf8');	

		if (convertShape) {
			console.log('      Konvertiere zu Shapefile');
			exec('ogr2ogr -overwrite -f "ESRI Shapefile" '+filename+'.shp '+filename+'.geojson', function (error, stdout, stderr) {
				if (stdout) console.log('stdout: ' + stdout);
				if (stderr) console.log('stderr: ' + stderr);
				if (error)  console.log('exec error: ' + error);
			});
		}
	}

	me.logStatistics = function () {
		var n = regions.features.length;
		var fieldCount = {};
		regions.features.forEach(function (feature) {
			var p = feature.properties;
			Object.keys(p).forEach(function (key) {
				var value = p[key];
				if (isFinite(value)) {
					if (fieldCount[key] === undefined) fieldCount[key] = 0;
					fieldCount[key]++;
				}
			})
		})

		var result = [];
		Object.keys(fieldCount).forEach(function (key) {
			result.push(key+'\t'+(fieldCount[key]/n));
		});

		console.log(result.join('\n'));
	}

	me.generateLokaler = function (options) {
		console.log('   Erstelle Zensus-Auswertungen');

		// Welche Zahlen sind für die Skalierung erlaubt?
		var allowedSteps = [];
		for (var i = -4; i <= 8; i++) {
			var f = Math.pow(10, i);
			allowedSteps.push(f*1);
			allowedSteps.push(f*2);
			allowedSteps.push(f*3);
			allowedSteps.push(f*5);
		}

		console.log('      Berechne Werte');
		options.fields.forEach(function (field) {

			var values = [];
			var isFunction = Object.prototype.toString.call(field.value) == '[object Function]';

			// Berechne Werte
			regions.features.forEach(function (region) {
				var value = isFunction ? field.value(region.properties) : region.properties[field.value];
				if (isFinite(value)) {
					values.push(value);
				} else {
					value = undefined;
				}
				region.properties['ZENSUS'+field.id] = value;
			});

			// Berechne Skale
			values = values.sort(function (a,b) { return a-b });

			var min = values[Math.round(values.length*0.01)];
			var max = values[Math.round(values.length*0.99)];

			if (field.min) min = field.min;
			if (field.max) max = field.max;

			var step = (max-min)/5;
			var bestStep = 1e30;
			allowedSteps.forEach(function (newStep) {
				if (Math.abs(Math.log(step/newStep)) < Math.abs(Math.log(step/bestStep))) bestStep = newStep;
			});
			var roundMin = Math.floor(min/bestStep)*bestStep;
			var roundMax = Math.ceil( max/bestStep)*bestStep;

			field.min = roundMin;
			field.max = roundMax;
			field.step = bestStep;

			// Berechne Farben
			regions.features.forEach(function (region) {
				var value = region.properties['ZENSUS'+field.id];
				var color = Math.round(options.nuances*(value-roundMin)/(roundMax-roundMin));
				if (color < 0) color = 0;
				if (color > options.nuances) color = options.nuances;
				region.properties['COLOR'+field.id] = (value === undefined) ? 0 : color+1;
			});

			field.colors = [field.gradient[0]];
			for (var i = 0; i <= options.nuances; i++) {
				field.colors[i+1] = interpolateColor(field.gradient, i/options.nuances);
			}
		});

		if (options.jsonFile) {
			console.log('      Generiere JSONs');

			var json = {
				x0:     [],
				y0:     [],
				width:  [],
				height: [],
				xc:     [],
				yc:     [],
				sTitle: [],
				sWiki:  [],
				value:  []
			};

			regions.features.forEach(function (region, i) {
				var b = calcBoundaries(region.geometry);
				json.x0[i]     = b.x0.toFixed(0);
				json.y0[i]     = b.y0.toFixed(0);
				json.width[i]  = b.w.toFixed(0);
				json.height[i] = b.h.toFixed(0);
				json.xc[i]     = (b.xc-b.x0).toFixed(0);
				json.yc[i]     = (b.yc-b.y0).toFixed(0);
				json.sTitle[i] = region.properties.GEN;
				json.sWiki[i]  = region.properties.wiki;
				if (json.sWiki[i] == json.sTitle[i]) json.sWiki[i] = 0;
			});

			options.fields.forEach(function (field) {
				regions.features.forEach(function (region, i) {
					var value = region.properties['ZENSUS'+field.id];
					if (value === undefined) {
						value = '';
					} else {
						value = value.toFixed(2);
					}
					json.value[i] = value;
				});
				json.sDesc = field.title;

				var jsonFile = options.jsonFile.replace(/\%/g, field.id);
				ensureFolder(jsonFile);
				
				var result = [];
				Object.keys(json).forEach(function (key) {
					var values = JSON.stringify(json[key]);
					if (key[0] == 's') {
						key = key.substr(1).toLowerCase();
					} else {
						values = values.replace(/\'|\"/g, '');
					}
					result.push('"'+key+'":'+values);
				});
				result = result.join('\n');
				result = '{\n'+result+'\n}';
				result = result.replace(/\,null\,/g, ',');
				result = result.replace(/\,null\,/g, ',');
				result = result.replace(/\,null\,/g, ',');

				fs.writeFileSync(jsonFile, result, 'utf8');
			});

		}

		if (options.previewFile) {
			console.log('      Generiere Previews');
			options.fields.forEach(function (field) {
				var svg = [
					'<?xml version="1.0" encoding="utf-8"?>',
					'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
					'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="1200px" height="1600px" xml:space="preserve">'
				];
				regions.features.forEach(function (region) {
					var color = field.colors[region.properties['COLOR'+field.id]];

					var path = [];
					switch (region.geometry.type) {
						case 'Polygon':
							path = GeoJSON2SVG(region.geometry.coordinates, 1);
						break;
						case 'MultiPolygon':
							path = GeoJSON2SVG(region.geometry.coordinates, 2);
						break;
						default:
							console.log(region.geometry);
							process.exit();
						break;
					}
					svg.push('<path d="'+path+'" fill="#'+color+'" stroke-width="0.2" stroke="#000"/>');
				});
				svg.push('</svg>');
				svg.join('\n');

				var previewFile = options.previewFile.replace(/\%/g, field.id);
				ensureFolder(previewFile);
				fs.writeFileSync(previewFile+'.svg', svg.join('\n'), 'utf8');

				exec('convert -background white -density 36 -quality 95 '+previewFile+'.svg '+previewFile+' && rm '+previewFile+'.svg');
			})
		}


		if (options.mapnikFile) {
			console.log('      Generiere Mapnik-XML');
			options.fields.forEach(function (field) {
				var xml = fs.readFileSync('./mapnik.template.xml', 'utf8');

				var rules = [];

				for (var i = 0; i <= options.nuances; i++) {
					var color = field.colors[i+1];
					var line = '<Rule><Filter>([COLOR'+field.id+']='+(i+1)+')</Filter><PolygonSymbolizer fill="#'+color+'" fill-opacity="1"/></Rule>';
					rules.push(line);
				}

				rules.push('<Rule><PolygonSymbolizer fill="#'+field.gradient[0]+'" fill-opacity="1"/></Rule>');

				xml = xml.replace(/\%id\%/g, field.id);
				xml = xml.replace(/\%rules\%/g, rules.join('\n\t\t'));
				xml = xml.replace(/\%shape\%/g, options.shapeFile);

				var mapnikFile = options.mapnikFile.replace(/\%/g, field.id);
				ensureFolder(mapnikFile);
				fs.writeFileSync(mapnikFile, xml, 'utf8');
			});
		}

		if (options.gradientFile) {
			console.log('      Generiere Gradient');
			options.fields.forEach(function (field) {
				var stops = [];
				for (var i = 1; i < field.gradient.length; i++) {
					stops.push('<stop offset="'+(i-1)/(field.gradient.length-2)+'" style="stop-color:#'+field.gradient[i]+'"/>');
				}

				var labels = [];
				var mini = Math.round(field.min/field.step);
				var maxi = Math.round(field.max/field.step);
				var digits = -Math.log(field.step)/Math.LN10;
				digits = Math.ceil(Math.max(digits, 0));

				for (var i = mini+1; i < maxi; i++) {
					labels.push('<text x="'+(580*(i-mini)/(maxi-mini))+'" y="90" style="font-family:\'MyriadPro-Regular\'; font-size:30;" text-anchor="middle">'+(i*field.step).toFixed(digits)+'</text>');
				}


				var svg = [
					'<?xml version="1.0" encoding="utf-8"?>',
					'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
					'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="580px" height="96px" viewBox="0 0 580 96" style="enable-background:new 0 0 580 96;" xml:space="preserve">',
					'<g>',
					'<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="0.5" y1="30" x2="579.5" y2="30">',
					stops.join('\n'),
					'</linearGradient>',
					'<rect x="0.5" y="0.5" style="fill:url(#SVGID_1_);" width="579" height="59"/>',
					'<path style="fill:#231F20;" d="M579,1v58H1V1H579 M580,0h-1H1H0v1v58v1h1h578h1v-1V1V0L580,0z"/>',
					'</g>',
					labels.join('\n'),
					'</svg>'
				];

				var gradientFile = options.gradientFile.replace(/\%/g, field.id);
				ensureFolder(gradientFile);
				fs.writeFileSync(gradientFile+'.svg', svg.join('\n'), 'utf8');

				exec('convert -background white -quality 95 '+gradientFile+'.svg '+gradientFile+' && rm '+gradientFile+'.svg');
			});
		}
	}

	return me;
}

exports.loadCSV = function (filename) {
	console.log('   Lade CSV "'+filename+'"');
	var data = fs.readFileSync(filename, 'utf8');

	console.log('      Lese CSV');
	data = data.split('\r\n');

	while (data[data.length-1].replace(/^\s+|\s+$/,'') == '') data.pop();

	var header = data.shift().replace(/\"/g, '').split(';');

	data = data.map(function (line) {
		var fields = line.replace(/\"/g, '').split(';');
		var result = {};
		header.forEach(function (colName, i) {
			result[colName] = fields[i];
		});
		return result;
	});

	return data;
}

var interpolateColor = function (gradient, value) {
	if (value < 0) value = 0;
	if (value > 1) value = 1;

	var value = value*(gradient.length-2);

	var index = Math.floor(value);
	if (index < 0) index = 0;
	if (index > gradient.length-3) index = gradient.length-3;

	var offset = value - index;
	if (offset < 0) offset = 0;
	if (offset > 1) offset = 1;

	index += 1;

	var color = '';
	for (var i = 0; i < 3; i++) {
		var v0 = parseInt(gradient[index  ].substr(i*2, 2), 16);
		var v1 = parseInt(gradient[index+1].substr(i*2, 2), 16);
		var v = Math.round((v1-v0)*offset + v0);
		v = '00'+v.toString(16);
		color += v.substr(v.length-2, 2);
	}

	return color;
}

var path = require('path');
var ensureFolder = function (folder) {
	folder = path.resolve(path.dirname(require.main.filename), folder);
	var rec = function (fol) {
		if (fol != '/') {
			rec(path.dirname(fol));
			if (!fs.existsSync(fol)) fs.mkdirSync(fol);
		}
	}
	rec(path.dirname(folder));
}

var GeoJSON2SVG = function (points, depth) {
	if (depth > 0) {
		return points.map(function (list) {
			return GeoJSON2SVG(list, depth-1)
		}).join(' ');
	} else {
		var lastPoint = '';
		var result = points.map(function (point) {
			var x = 200*( point[0] -  5.5)*0.616;
			var y = 200*(-point[1] + 55.1);
			return x.toFixed(0)+','+y.toFixed(0);
		});

		do {
			var smaller = false;

			for (var i = 0; i < result.length; i++) {
				if ((i >= 1) && (result[i] == result[i-1])) {
					result[i-1] = undefined;
					smaller = true;
				}
			}

			var temp = [];
			result.forEach(function (point) {
				if (point !== undefined) temp.push(point);
			});
			result = temp;

			for (var i = 0; i < result.length; i++) {
				if ((i >= 2) && (result[i] == result[i-2])) {
					result[i-1] = undefined;
					result[i-2] = undefined;
					smaller = true;
				}
			}

			var temp = [];
			result.forEach(function (point) {
				if (point !== undefined) temp.push(point);
			});
			result = temp;
		} while (smaller);

		if (result.length <= 2) {
			return '';
		} else {
			return 'M'+result.join('L')+'z';
		}
	}
}

var calcBoundaries = function (geometry) {

	var b = {x0:1e10, y0:1e10, x1:-1e10, y1:-1e10};

	var addPoint = function (x, y) {
		if (b.x0 > x) b.x0 = x;
		if (b.y0 > y) b.y0 = y;
		if (b.x1 < x) b.x1 = x;
		if (b.y1 < y) b.y1 = y;
	}

	var maxArea, xc, yc;

	var addPolygon = function (poly, depth) {
		if (depth > 1) {
			poly.forEach(function (point) { addPolygon(point, depth-1) });
		} else {
			var xs = 0;
			var ys = 0;
			var area = 0;
			for (var i = 0; i < poly.length; i++) {
				var j = (i+1) % poly.length;
				
				var x  = poly[i][0];
				var y  = poly[i][1];
				var x1 = poly[j][0];
				var y1 = poly[j][1];

				var a = (x*y1 - x1*y);

				xs   += (x+x1)*a;
				ys   += (y+y1)*a;
				area += a;

				addPoint(x,y);
			}
			if (Math.abs(area) > maxArea) {
				xc = xs/(3*area);
				yc = ys/(3*area);
				maxArea = Math.abs(area);
			}
		}
	}

	maxArea = -1e10;

	switch (geometry.type) {
		case 'Polygon':
			var geo = geometry.coordinates;
			addPolygon(geo, 2);
		break;
		case 'MultiPolygon':
			var geo = geometry.coordinates;
			addPolygon(geo, 3);
		break;
		default:
			console.error('Unknown Geometry Type: ' + geometry.type);
			process.exit();
	}

	var scaleFactor = 3000;

	var xOffset =  5.8;
	var yOffset = 47.2;

	b.x0 = Math.round((b.x0-xOffset)*scaleFactor);
	b.y0 = Math.round((b.y0-yOffset)*scaleFactor);
	b.x1 = Math.round((b.x1-xOffset)*scaleFactor);
	b.y1 = Math.round((b.y1-yOffset)*scaleFactor);
	b.w  = b.x1 - b.x0;
	b.h  = b.y1 - b.y0;
	b.xc = Math.round((xc-xOffset)*scaleFactor);
	b.yc = Math.round((yc-yOffset)*scaleFactor);

	return b;
}