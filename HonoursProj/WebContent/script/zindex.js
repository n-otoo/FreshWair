var app = angular.module('FreshWair', []);
app.controller('FreshWairController', ['$scope', '$window', function($scope, window) {
$scope.win = window;	
$scope.hasAcceptedLocation = {value:false};
$scope.selectedDateRange = {start:null, end:null};
$scope.isNow = {value: false};
$scope.popup = {
	show:false,
	min: {value:null,time:null},
	avg: {value:null,time:null},
	max: {value:null,time:null},
	recent:{pm25:null, pm10:null,time:null},
	info:{show:false}
}

var markers = [];
var apiUrl = location.origin + "/scarf/env/pm";
/**
 * 
 */
//the document ready function
try	{
	$(function()
		{
		init();
		}
	);
} catch (e) {
	alert("*** jQuery not loaded. ***");
}

//
// Initialise page.
//
function init(){
	
	// Initialise the map
	$scope.mymap = L.map('mymap').setView([57.149, -2.094], 13);
	
	// Add the tile layers to the map (the images that make up sections of the map)
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}).addTo($scope.mymap);;

	$scope.mymap.on('click', function(ev) {
		getCurrentLocationData(apiUrl, ev.latlng.lat, ev.latlng.lng, $scope.selectedDateRange.start.valueOf(), $scope.selectedDateRange.end.valueOf());
		addRadiusCircleToMap(ev.latlng.lat, ev.latlng.lng);
		$scope.$apply();
	});

	
	// Make a web request to retrieve the data from the DB
	getAllData(apiUrl);
	createDateRangeSlider();
	
	function getAllData(url){
			$.ajax({
			  method: "GET",
			  url: url + "/all"
			})
			.then(function(success, status){
				mapPMData(success);
			},function(error, status){
				alert(error.responseText);
			});
	}
	
	function getCurrentLocationData(url, lat, lon, startTime, endTime){		
		$.ajax({
		  method: "GET",
		  url: url + "?startTime=" + startTime + "&endTime=" + endTime  + "&lat=" + lat + "&lon=" + lon 
		})
		.then(function(success, status){
			// mapRealPMData(success);
			getPopupInformation(success);
			getMostRecentLocationData(url, lat, lon);
			calculateAirQualityIndex();
			$scope.lastLatLong = {lat:lat, lon:lon};
		},function(error, status){
			alert(error.responseText);
		});
	}

	function getMostRecentLocationData(url, lat, lon){
		
		$.ajax({
		  method: "GET",
		  url: url + "/latest?lat=" + lat + "&lon=" + lon 
		})
		.then(function(success){
			$scope.popup.recent.time = new Date(success.dateTime).toGMTString();
			$scope.popup.recent.pm25 = success.pm25;
			$scope.popup.recent.pm10 = success.pm10;
			$scope.popup.recent.raw = {pm25:success.pm25, pm10:success.pm10}

			// AQI
			var recPM25EQVariables = getStaticCalcVariables("pm25",$scope.popup.recent.raw);
			var recPM10EQVariables = getStaticCalcVariables("",$scope.popup.recent.raw);
			var recpm25AQI = getAQIFromConc(recPM25EQVariables.ConcHi,recPM25EQVariables.ConcLo,recPM25EQVariables.AqiHi,recPM25EQVariables.AqiLo, $scope.popup.recent.raw.pm25);
			var recpm10AQI = getAQIFromConc(recPM10EQVariables.ConcHi,recPM10EQVariables.ConcLo,recPM10EQVariables.AqiHi,recPM10EQVariables.AqiLo, $scope.popup.recent.raw.pm10);
			$scope.popup.recent.aqi = {pm10: recpm10AQI, pm25:recpm25AQI};
			$scope.popup.show = true;
			$scope.$apply();
		},function(error, status){
			alert(error.responseText);
		});
	}

	function getPopupInformation(PMData){
		if(PMData.length > 0){
			var average = averagePMData(PMData);
			$scope.popup.avg.value = "( PM 2.5:" + average[0].toFixed(2) + " | PM10:" + average[1].toFixed(2) + " )";
			$scope.popup.avg.raw = {pm25:average[0], pm10:average[1]}
			var minmax = getMinAndMax(PMData);
			$scope.popup.min.value = minmax[0].value;
			$scope.popup.min.time = minmax[0].time;
			$scope.popup.min.raw = minmax[0].raw;
			$scope.popup.max.value = minmax[1].value;
			$scope.popup.max.time = minmax[1].time;
			$scope.popup.max.raw = minmax[1].raw;			
		}
	}

	function getMinAndMax(PMData){
		var min = {value:null, time:null};
		var max = {value:null, time:null};  
		PMData.sort(function(a,b){
			return a.pm25 - b.pm25
		});
		min.value = "( PM 2.5:" + PMData[0].pm25 + " | PM10:" + PMData[0].pm10 + " )";
		min.raw = {pm25:PMData[0].pm25, pm10:PMData[0].pm10}
		min.time = new Date(PMData[0].dateTime).toGMTString();

		PMData.reverse();
		max.value = "( PM 2.5:" + PMData[0].pm25 + " | PM10:" + PMData[0].pm10 + " )";
		max.raw = {pm25:PMData[0].pm25, pm10:PMData[0].pm10}
		max.time = new Date(PMData[0].dateTime).toGMTString();

		return [min, max];
	}

	$scope.getColorForAQI = function(type){
		if($scope.popup.min.aqi && $scope.popup.recent.aqi){
			switch(type){
				case 'recent':
					return getColor($scope.popup.recent.aqi.pm25)
					break;
				case 'min':
					return getColor($scope.popup.min.aqi.pm25)
					break;
				case 'max':
					return getColor($scope.popup.max.aqi.pm25)
					break;
				case 'average':
					return getColor($scope.popup.avg.aqi.pm25)
					break;
				default:
					return "snow"
					break;
			} 
		} else {
			return "snow";
		}
	}

	function getColor(number){
		if(number <= 50){
			return '#cfeb80'
		} else if (number <= 100){
			return 'yellow'
		} else if (number <= 150){
			return 'orange'
		} else if (number <= 200){
			return 'red'
		} else if(number <=300){
			return 'violet'
		} else {
			return 'maroon'
		}
	}



	function averagePMData(array){
		var pm25Array = array.map((pm) => pm.pm25);
		var pm10Array = array.map((pm) => pm.pm10);
		var pm25total = pm25Array.reduce((last, current) => current += last);
		var pm10total = pm10Array.reduce((last, current) => current += last);

		return [(pm25total/array.length), (pm10total/array.length)];
	}

	function calculateAirQualityIndex(){
		if($scope.popup.min.value){
			// Minimum AQI
			var minPM25EQVariables = getStaticCalcVariables("pm25",$scope.popup.min.raw);
			var minPM10EQVariables = getStaticCalcVariables("",$scope.popup.min.raw);
			var minpm25AQI = getAQIFromConc(minPM25EQVariables.ConcHi,minPM25EQVariables.ConcLo,minPM25EQVariables.AqiHi,minPM25EQVariables.AqiLo, $scope.popup.min.raw.pm25);
			var minpm10AQI = getAQIFromConc(minPM10EQVariables.ConcHi,minPM10EQVariables.ConcLo,minPM10EQVariables.AqiHi,minPM10EQVariables.AqiLo, $scope.popup.min.raw.pm10);
			$scope.popup.min.aqi = {pm10: minpm10AQI, pm25:minpm25AQI};

			// Average AQI
			var avgPM25EQVariables = getStaticCalcVariables("pm25",$scope.popup.avg.raw);
			var avgPM10EQVariables = getStaticCalcVariables("",$scope.popup.avg.raw);
			var avgpm25AQI = getAQIFromConc(avgPM25EQVariables.ConcHi,avgPM25EQVariables.ConcLo,avgPM25EQVariables.AqiHi,avgPM25EQVariables.AqiLo, $scope.popup.avg.raw.pm25);
			var avgpm10AQI = getAQIFromConc(avgPM10EQVariables.ConcHi,avgPM10EQVariables.ConcLo,avgPM10EQVariables.AqiHi,avgPM10EQVariables.AqiLo, $scope.popup.avg.raw.pm10);
			$scope.popup.avg.aqi = {pm10: avgpm10AQI, pm25:avgpm25AQI};

			// Maximum AQI
			var maxPM25EQVariables = getStaticCalcVariables("pm25",$scope.popup.max.raw);
			var maxPM10EQVariables = getStaticCalcVariables("",$scope.popup.max.raw);
			var maxpm25AQI = getAQIFromConc(maxPM25EQVariables.ConcHi,maxPM25EQVariables.ConcLo,maxPM25EQVariables.AqiHi,maxPM25EQVariables.AqiLo, $scope.popup.max.raw.pm25);
			var maxpm10AQI = getAQIFromConc(maxPM10EQVariables.ConcHi,maxPM10EQVariables.ConcLo,maxPM10EQVariables.AqiHi,maxPM10EQVariables.AqiLo, $scope.popup.max.raw.pm10);
			$scope.popup.max.aqi = {pm10: maxpm10AQI, pm25:maxpm25AQI};
		}
	}

	function getStaticCalcVariables(type, raw){
		var  cl; var ch;var ci; var al;var ah;
		if(type == "pm25"){			
			if(raw.pm25 < 12){
				cl = 0;ch = 12; al = 0; ah = 50;
			} else if(raw.pm25 < 35.4){
				cl = 12.1;ch = 35.4; al = 51; ah = 100;
			} else if(raw.pm25 < 55.4){
				cl = 35.5;ch = 55.4; al = 101; ah = 150;
			} else if(raw.pm25 < 150.4){
				cl = 55.5;ch = 150.4; al = 151; ah = 200;
			} else if(raw.pm25 < 250.4){
				cl = 150.5;ch = 250.4; al = 201; ah = 300;
			} else {
				cl = 250.5;ch = 500.4; al = 301; ah = 500;
			}

		} else {
			if(raw.pm10 < 54){
				cl = 0;ch = 54; al = 0; ah = 50;
			} else if(raw.pm10 < 154){
				cl = 55;ch = 154; al = 51; ah = 100;
			} else if(raw.pm10 < 254){
				cl = 155;ch = 254; al = 101; ah = 150;
			} else if(raw.pm10 < 354){
				cl = 255;ch = 354; al = 151; ah = 200;
			} else if(raw.pm10 < 424){
				cl = 355;ch = 424; al = 201; ah = 300;
			} else {
				cl = 425;ch = 604; al = 301; ah = 500;
			}
		}

		return {ConcHi:ch, ConcLo:cl, AqiHi:ah, AqiLo:al}
	}

	function getAQIFromConc(concHi, concLo, aqiHi, aqiLo, concinput){
		return (((aqiHi - aqiLo ) / (concHi - concLo)) * (concinput - concLo)) + aqiLo 
	}
	
	function mapPMData(PMData){
		PMData.forEach(function(pm){
			var marker = L.marker([pm.lat, pm.lon]).addTo($scope.mymap);
			marker.bindPopup("PM2.5: " + pm.pm25 + " - PM10:" + pm.pm10 + " - " + "Timestamp:" + new Date(pm.dateTime).toGMTString());
			markers.push(marker);
			console.log("Marrker added with data :: " + "PM2.5: " + pm.pm25 + " - PM10:" + pm.pm10 + " - " + "Timestamp:" + pm.dateTime);
		});
	}
	
	function mapRealPMData(PMData){
		PMData.forEach(function(pm){
			var marker = L.marker([pm.lat, pm.lon]).addTo($scope.mymap);
			marker.bindPopup("PM2.5: " + pm.pm25 + " - PM10:" + pm.pm10 + " - " + "Timestamp:" + pm.dateTime);
			markers.push(marker);
			console.log("Marrker added with data :: " + "PM2.5: " + pm.pm25 + " - PM10:" + pm.pm10 + " - " + "Timestamp:" + pm.dateTime);
		});
	}

	function createDateRangeSlider(){
		//Create todays date so we can get a view for a month ago until a month in the future
		$scope.currentDate = new Date();
		$scope.currentDate.setHours(0,0,0,0);
		var defaultEndDate = new Date($scope.currentDate);
		defaultEndDate.setHours(defaultEndDate.getHours() + 23);
		
		
		// This creates the actual bounds i.e. max date before and after
		var startDate = new Date($scope.currentDate);
		startDate.setDate(startDate.getDate() - 28);
		var endDate = new Date($scope.currentDate);
		endDate.setDate(endDate.getDate() + 28);

		// Set the intial date of the scope for web request
		$scope.selectedDateRange.start = new Date($scope.currentDate);
		$scope.selectedDateRange.end = defaultEndDate;
		
		
		$("#dateSlider").dateRangeSlider({
			bounds: {
				min: startDate,
				max: endDate
			},
			defaultValues:{
			    min: $scope.currentDate,
			    max: defaultEndDate
			},
			enabled: true
		});

		$("#dateSlider").bind("userValuesChanged", function(e, data){
			$scope.selectedDateRange.start = new Date(data.values.min);
			$scope.selectedDateRange.end = new Date(data.values.max);
			$scope.refreshCurrentData();
			//console.log($scope.selectedDateRange);
		});
	}

	$scope.refreshCurrentData = function(){
		if($scope.lastLatLong){
			getCurrentLocationData(apiUrl, $scope.lastLatLong.lat, $scope.lastLatLong.lon, $scope.selectedDateRange.start.valueOf(), $scope.selectedDateRange.end.valueOf());
		}
	}

	$scope.enableSlider = function(){
		$("#dateSlider").dateRangeSlider({ enabled: true });
	}
	
	$scope.setTimeToNowAndDisableSlider = function(){
		var startDate = new Date();
		var endDate = new Date(startDate);
		endDate.setHours(endDate.getHours() - 8);
		$("#dateSlider").dateRangeSlider("values", startDate, endDate);

		$scope.selectedDateRange.start = new Date($("#dateSlider").dateRangeSlider("values").min);
		$scope.selectedDateRange.end = new Date($("#dateSlider").dateRangeSlider("values").max);
	}

	$scope.closePopup = function(){
		$scope.popup.show = false;
		$scope.currentLocationRadius.remove();		
	}

	$scope.closeInfoPopup = function(){
		$scope.popup.info.show = false;
	}
	
	$scope.toUsersLocation = function(){
		navigator.geolocation.getCurrentPosition(
				function(resp){
					//alert("Latitude: " + resp.coords.latitude +"\nLongitude: " + resp.coords.longitude);
					getCurrentLocationData(apiUrl, resp.coords.latitude, resp.coords.longitude,$scope.selectedDateRange.start.valueOf(), $scope.selectedDateRange.end.valueOf());
					console.log(resp.coords.latitude, resp.coords.longitude)
					$scope.mymap.setView([resp.coords.latitude, resp.coords.longitude], 16, {animate:true});

					addRadiusCircleToMap(resp.coords.latitude, resp.coords.longitude);
				},
				function(err){
					console.log("Couln't retrieve location information");
				}
		);
	}

	function addRadiusCircleToMap(lat, lon){
		//Incase we've accidentally created  a marker, ensure we remove it before displaying the new
		if($scope.currentLocationRadius){
			$scope.currentLocationRadius.remove();
			$scope.currentLocationRadius = null;
		} 

		$scope.currentLocationRadius = L.circle([lat, lon], {
			color: "#ff0000",
			opacity: 0.7,
			radius:1000
		}).addTo($scope.mymap);
	}
}
}]);