var fs = require('fs');
var exec = require('child_process').exec;
var isWin = (/^win/.test(require('os').platform()));

exports.loadGeoJSON = function (filename) {
	var me = this;

	me.fields;

	console.log('   Lade GeoJSON "' + filename + '"');
	var regions = fs.readFileSync(filename, 'utf8');

	console.log('      Lese GeoJSON');
	regions = JSON.parse(regions);

	me.count = function () {
		return regions.features.length;
	}

	me.match = function (options, translateID) {
		console.log('   Matching');
		var data = options.data;
		var lut = {};
		var done = 0;
		var test = {};
		var foreignIdFunction;
		if (Object.prototype.toString.call(options.foreignField) == '[object Function]') {
			foreignIdFunction = options.foreignField;
		} else {
			foreignIdFunction = function (entry) {
				return entry[options.foreignField]
			};
		}
		data.forEach(function (entry) {
			var lut_id = foreignIdFunction(entry);
			lut['_' + lut_id] = entry;
		});

		var idFunction;
		if (Object.prototype.toString.call(options.myField) == '[object Function]') {
			idFunction = options.myField;
		} else {
			idFunction = function (properties) {
				return properties[options.myField]
			};
		}

		regions.features.forEach(function (region) {
			var id = idFunction(region.properties);
			if (translateID) {
				id = translateID(id);
			}
			if (lut['_' + id] === undefined) {
				if (!options.hideWarning || !options.hideWarning(region.properties)) {
					console.warn('id "' + id + '" nicht gefunden');
					console.warn(region.properties);
				}
			} else {
				if (!test[id]) {
					test[id] = true;
					done++;
				}
				options.addFields.forEach(function (field) {
					var newName = field.newName ? field.newName : field.name;
					var value = field.convert(lut['_' + id][field.name]);
					if (region.properties[newName] !== undefined) {
						var abw = Math.abs(region.properties[newName] / value - 1);
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
		console.log('      Import:', done, ' von ', data.length, '; Total:', me.count());
	};

	me.saveGeo = function (filename, convertShape) {
		console.log('   Erstelle GeoJSON');
		var json = JSON.stringify(regions/*, null, '\t'*/);

		console.log('      Speichere GeoJSON');
		ensureFileFolder(filename);
		fs.writeFileSync(filename + '.geojson', json, 'utf8');

		if (convertShape) {
			console.log('      Konvertiere zu Shapefile');
			var cmd = (isWin ? 'C:/Tools/maps/gdal/bin/ogr2ogr.exe' : '/Library/Frameworks/GDAL.framework/Programs/ogr2ogr') + ' -overwrite -f "ESRI Shapefile" ' + filename + '.shp ' + filename + '.geojson';
			exec(cmd, function (error, stdout, stderr) {
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
			result.push(key + '\t' + (fieldCount[key] / n));
		});

		console.log(result.join('\n'));
	}

	me.setFields = function (nuances, fields) {
		console.log('   Erstelle Zensus-Auswertungen');
		me.fields = fields;
		me.nuances = nuances;

		// Welche Zahlen sind für die Skalierung erlaubt?
		var allowedSteps = [];
		for (var i = -4; i <= 8; i++) {
			var f = Math.pow(10, i);
			allowedSteps.push(f * 1);
			allowedSteps.push(f * 2);
			allowedSteps.push(f * 3);
			allowedSteps.push(f * 5);
		}

		var id, minLength;
		console.log('      Generiere Auto-Ids');
		me.fields.forEach(function (field) {
			if (field.id) {
				id = parseInt(field.id, 10);
				minLength = field.id.length;
			} else {
				id++;
				field.id = id.toFixed(0);
				if (field.id.length < minLength) {
					field.id = ('0000000000' + field.id).substr(10 + field.id.length - minLength, minLength);
				}
			}
		});

		console.log('      Berechne Werte');
		me.fields.forEach(function (field) {

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
				region.properties['ZENSUS' + field.id] = value;
			});

			// Berechne Skale
			values = values.sort(function (a, b) {
				return a - b
			});

			var min = values[Math.round(values.length * 0.01)];
			var max = values[Math.round(values.length * 0.99)];

			if (field.min) min = field.min;
			if (field.max) max = field.max;

			var step = (max - min) / 5;
			var bestStep = 1e30;
			allowedSteps.forEach(function (newStep) {
				if (Math.abs(Math.log(step / newStep)) < Math.abs(Math.log(step / bestStep))) bestStep = newStep;
			});
			var roundMin = Math.floor(min / bestStep) * bestStep;
			var roundMax = Math.ceil(max / bestStep) * bestStep;

			field.min = roundMin;
			field.max = roundMax;
			field.step = bestStep;

			// Berechne Farben
			regions.features.forEach(function (region) {
				var value = region.properties['ZENSUS' + field.id];
				var color = Math.round(me.nuances * (value - roundMin) / (roundMax - roundMin));
				if (color < 0) color = 0;
				if (color > me.nuances) color = me.nuances;
				region.properties['COLOR' + field.id] = (value === undefined) ? 0 : color + 1;
			});

			field.colors = [field.gradient[0]];
			for (var i = 0; i <= me.nuances; i++) {
				field.colors[i + 1] = interpolateColor(field.gradient, i / me.nuances);
			}
		});
	},

		me.generateJSONs = function (jsonFilename) {
			console.log('   Generiere JSONs');

			var json = {
				x0: [],
				y0: [],
				width: [],
				height: [],
				xc: [],
				yc: [],
				sTitle: [],
				sWiki: [],
				value: [],
				bev: [],
				ags: []
			};

			regions.features.forEach(function (region, i) {
				var b = calcBoundaries(region.geometry);
				json.x0[i] = b.x0.toFixed(0);
				json.y0[i] = b.y0.toFixed(0);
				json.width[i] = b.w.toFixed(0);
				json.height[i] = b.h.toFixed(0);
				json.xc[i] = (b.xc - b.x0).toFixed(0);
				json.yc[i] = (b.yc - b.y0).toFixed(0);
				json.bev[i] = region.properties.EWZ;
				json.sTitle[i] = region.properties.GEN;
				json.sWiki[i] = region.properties.wiki;
				if (json.sWiki[i] == json.sTitle[i]) json.sWiki[i] = 0;
				json.ags[i] = region.properties.AGS;
			});

			me.fields.forEach(function (field) {
				regions.features.forEach(function (region, i) {
					var value = region.properties['ZENSUS' + field.id];
					if (value === undefined) {
						value = '';
					} else {
						value = value.toFixed(2);
					}
					json.value[i] = value;
				});
				json.sDesc = field.title;

				var jsonFile = jsonFilename.replace(/\%/g, field.id);
				ensureFileFolder(jsonFile);

				var result = [];
				Object.keys(json).forEach(function (key) {
					var values = JSON.stringify(json[key]);
					if (key == "ags") {
						//leave the AGS alone!!!1!
					} else if (key[0] == 's') {
						key = key.substr(1).toLowerCase();
					} else {
						values = values.replace(/\'\'/g, 'null');
						values = values.replace(/\"\"/g, 'null');
						values = values.replace(/\'|\"/g, '');
					}
					result.push('"' + key + '":' + values);
				});
				result = result.join(',\n');
				result = '{\n' + result + '\n}';

				fs.writeFileSync(jsonFile, result, 'utf8');
			});
		}

	me.generatePreviews = function (previewFilename, scale, makepng) {
		if (!scale) scale = 1;

		console.log('   Generiere Previews');

		var svg = [
			'<?xml version="1.0" encoding="utf-8"?>',
			'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
			'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="600px" height="840px" xml:space="preserve">',
			'<text x="300" y="25" style="font-family:Georgia; font-size:15; letter-spacing:0em" text-anchor="middle">%%%text%%%</text>',
			'<text x="599" y="837" style="font-family:Georgia; font-size:5;" text-anchor="end">CC-BY OpenDataCity</text>'
		];
		regions.features.forEach(function (region) {
			var path = [];
			switch (region.geometry.type) {
				case 'Polygon':
					path = GeoJSON2SVG(region.geometry.coordinates, 1, scale);
					break;
				case 'MultiPolygon':
					path = GeoJSON2SVG(region.geometry.coordinates, 2, scale);
					break;
				default:
					console.log(region.geometry);
					process.exit();
					break;
			}
			svg.push('<path d="' + path + '" fill="#%%%0%%%" stroke-width="0.1" stroke="#000"/>');
		});
		svg.push('</svg>');
		svg = svg.join('\n');
		svg = svg.split('%%%');

		me.fields.forEach(function (field) {
			svg[1] = field.title;
			regions.features.forEach(function (region, index) {
				svg[index * 2 + 3] = field.colors[region.properties['COLOR' + field.id]];
			})

			var previewFile = previewFilename.replace(/\%/g, field.id);
			previewFile = previewFile.replace(/\.[^\.]+$/, '.svg');

			ensureFileFolder(previewFile);

			fs.writeFileSync(previewFile, svg.join(''), 'utf8');
		})
		if (!makepng)
			return;
		console.log('      Konvertiere Previews');

		var previewFiles = previewFilename.replace(/\%/g, '*');
		previewFiles = previewFiles.replace(/\.[^\.]+$/, '.svg');
		var cmd;
		if (isWin)
			cmd = '"C:/Program Files/ImageMagick-6.8.6-Q16/mogrify.exe" -background white -density ' + (72 * scale) + ' -format png -quality 95 ' + previewFiles;
		else
			cmd = 'mogrify -background white -density ' + (72 * scale) + ' -format png -quality 95 ' + previewFiles + ' && rm ' + previewFiles;
		exec(cmd, function (error, stdout, stderr) {
			if (stdout) console.log('stdout: ' + stdout);
			if (stderr) console.log('stderr: ' + stderr);
			if (error)  console.log('exec error: ' + error);
		});
	}

	me.generateMapniks = function (templateFilename, mapnikPath, shapeFilename) {
		console.log('   Generiere Mapnik-XML & Tirex-Conf');
		var mapnikFilename = mapnikPath + 'zensus%.xml';
		var configFilename = mapnikPath + 'conf/zensus%.conf';
		me.fields.forEach(function (field) {
			var xml = fs.readFileSync(templateFilename, 'utf8');

			var rules = [];

			for (var i = 0; i <= me.nuances; i++) {
				var color = field.colors[i + 1];
				var line = '<Rule><Filter>([COLOR' + field.id + ']=' + (i + 1) + ')</Filter><PolygonSymbolizer fill="#' + color + '" fill-opacity="1"/></Rule>';
				rules.push(line);
			}

			rules.push('<Rule><PolygonSymbolizer fill="#' + field.gradient[0] + '" fill-opacity="1"/></Rule>');

			xml = xml.replace(/\%id\%/g, field.id);
			xml = xml.replace(/\%rules\%/g, rules.join('\n\t\t'));
			xml = xml.replace(/\%shape\%/g, '/var/www/tiles.odcdn.de/data/shapes' + shapeFilename);
			xml = xml.replace(/\%countries\%/g, '/var/www/tiles.odcdn.de/data/shapes/countries/10m-admin-0-countries.shp');
			xml = xml.replace(/\%vg250\%/g, '/var/www/tiles.odcdn.de/data/shapes/VG250/VG250_Bundeslaender.shp');



			var mapnikFile = mapnikFilename.replace(/\%/g, field.id);
			ensureFileFolder(mapnikFile);
			fs.writeFileSync(mapnikFile, xml, 'utf8');

			var list = [];
			list.push('name=zensus' + field.id);
			list.push('tiledir=/var/www/tiles.odcdn.de/tiles/zensus' + field.id);
			list.push('minz=0');
			list.push('maxz=18');
			list.push('mapfile=/var/www/tiles.odcdn.de/maps/zensus/zensus' + field.id + '.xml');
			var configFile = configFilename.replace(/\%/g, field.id);
			ensureFileFolder(configFile);
			fs.writeFileSync(configFile, list.join('\n'), 'utf8');
		});
	}

	me.generateGradients = function (gradientFilename) {
		console.log('   Generiere Gradients');
		me.fields.forEach(function (field) {
			var stops = [];
			for (var i = 1; i < field.gradient.length; i++) {
				stops.push('<stop offset="' + (i - 1) / (field.gradient.length - 2) + '" style="stop-color:#' + field.gradient[i] + '"/>');
			}

			var labels = [];
			var mini = Math.round(field.min / field.step);
			var maxi = Math.round(field.max / field.step);
			var digits = -Math.log(field.step) / Math.LN10;
			digits = Math.ceil(Math.max(digits, 0));

			for (var i = mini + 1; i < maxi; i++) {
				labels.push('<text x="' + (580 * (i - mini) / (maxi - mini)) + '" y="90" style="font-family:\'MyriadPro-Regular\'; font-size:30;" text-anchor="middle">' + (i * field.step).toFixed(digits) + '</text>');
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

			var gradientFile = gradientFilename.replace(/\%/g, field.id);
			gradientFile = gradientFile.replace(/\.[^\.]+$/, '.svg');

			ensureFileFolder(gradientFile);

			fs.writeFileSync(gradientFile, svg.join('\n'), 'utf8');
		});


		console.log('      Konvertiere Gradients');
		var gradientFiles = gradientFilename.replace(/\%/g, '*');
		gradientFiles = gradientFiles.replace(/\.[^\.]+$/, '.svg');

		var cmd;
		if (isWin)
			cmd = '"C:/Program Files/ImageMagick-6.8.6-Q16/mogrify.exe" -background white -format png -quality 95 ' + gradientFiles;
		else
			cmd = 'mogrify -background white -format png -quality 95 ' + gradientFiles + ' && rm ' + gradientFiles;
		exec(cmd);
	}

	return me;
}

exports.loadCSV = function (filename) {
	console.log('   Lade CSV "' + filename + '"');
	var data = fs.readFileSync(filename, 'utf8');

	data = data.split('\r\n');

	while (data[data.length - 1].replace(/^\s+|\s+$/, '') == '') data.pop();

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

	var value = value * (gradient.length - 2);

	var index = Math.floor(value);
	if (index < 0) index = 0;
	if (index > gradient.length - 3) index = gradient.length - 3;

	var offset = value - index;
	if (offset < 0) offset = 0;
	if (offset > 1) offset = 1;

	index += 1;

	var color = '';
	for (var i = 0; i < 3; i++) {
		var v0 = parseInt(gradient[index  ].substr(i * 2, 2), 16);
		var v1 = parseInt(gradient[index + 1].substr(i * 2, 2), 16);
		var v = Math.round((v1 - v0) * offset + v0);
		v = '00' + v.toString(16);
		color += v.substr(v.length - 2, 2);
	}

	return color;
}

var path = require('path');
var pathSep = path.sep;
var ensureFileFolder = function (filename) {
	filename = path.resolve(path.dirname(require.main.filename), filename);
	var dirs = filename.split(pathSep);
	dirs.pop();
	var root = "";

	mkDir();

	function mkDir() {
		var dir = dirs.shift();
		if (dir === "") {// If directory starts with a /, the first path will be an empty string.
			root = pathSep;
		}
		if (!fs.existsSync(root + dir)) {
			fs.mkdirSync(root + dir);
			root += dir + pathSep;
			if (dirs.length > 0) {
				mkDir();
			}
		} else {
			root += dir + pathSep;
			if (dirs.length > 0) {
				mkDir();
			}
		}
	}
};


var GeoJSON2SVG = function (points, depth, scale) {
	if (depth > 0) {
		return points.map(function (list) {
			return GeoJSON2SVG(list, depth - 1, scale)
		}).join(' ');
	} else {
		var lastPoint = '';
		var s = 4 * scale;
		var digits = Math.ceil(Math.log(s) / Math.LN10);
		var result = points.map(function (point) {
			var x = 61.6 * ( point[0] - 5.5) - 5;
			var y = 100.0 * (-point[1] + 55.1) + 40;

			x = Math.round(x * s) / s;
			y = Math.round(y * s) / s;

			return x.toFixed(digits) + ',' + y.toFixed(digits);
		});

		do {
			var smaller = false;

			for (var i = 0; i < result.length; i++) {
				if ((i >= 1) && (result[i] == result[i - 1])) {
					result[i - 1] = undefined;
					smaller = true;
				}
			}

			var temp = [];
			result.forEach(function (point) {
				if (point !== undefined) temp.push(point);
			});
			result = temp;

			for (var i = 0; i < result.length; i++) {
				if ((i >= 2) && (result[i] == result[i - 2])) {
					result[i - 1] = undefined;
					result[i - 2] = undefined;
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
			return 'M' + result.join('L') + 'z';
		}
	}
}

var calcBoundaries = function (geometry) {

	var b = {x0: 1e10, y0: 1e10, x1: -1e10, y1: -1e10};

	var addPoint = function (x, y) {
		if (b.x0 > x) b.x0 = x;
		if (b.y0 > y) b.y0 = y;
		if (b.x1 < x) b.x1 = x;
		if (b.y1 < y) b.y1 = y;
	}

	var maxArea, xc, yc;

	var addPolygon = function (poly, depth) {
		if (depth > 1) {
			poly.forEach(function (point) {
				addPolygon(point, depth - 1)
			});
		} else {
			var xs = 0;
			var ys = 0;
			var area = 0;
			for (var i = 0; i < poly.length; i++) {
				var j = (i + 1) % poly.length;

				var x = poly[i][0];
				var y = poly[i][1];
				var x1 = poly[j][0];
				var y1 = poly[j][1];

				var a = (x * y1 - x1 * y);

				xs += (x + x1) * a;
				ys += (y + y1) * a;
				area += a;

				addPoint(x, y);
			}
			if (Math.abs(area) > maxArea) {
				xc = xs / (3 * area);
				yc = ys / (3 * area);
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

	var xOffset = 5.8;
	var yOffset = 47.2;

	b.x0 = Math.round((b.x0 - xOffset) * scaleFactor);
	b.y0 = Math.round((b.y0 - yOffset) * scaleFactor);
	b.x1 = Math.round((b.x1 - xOffset) * scaleFactor);
	b.y1 = Math.round((b.y1 - yOffset) * scaleFactor);
	b.w = b.x1 - b.x0;
	b.h = b.y1 - b.y0;
	b.xc = Math.round((xc - xOffset) * scaleFactor);
	b.yc = Math.round((yc - yOffset) * scaleFactor);

	return b;
}