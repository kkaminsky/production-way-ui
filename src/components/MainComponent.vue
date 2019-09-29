<template>
  <v-container grid-list-md>
    <v-layout row wrap>
      <v-flex md12>
        <v-container fluid>
          <v-layout row>
            <v-flex md8 offset-md2 class="headline my-4" style="text-align: center">
              <p>Конструктор производственных маршрутов
              </p>
            </v-flex>
          </v-layout>
          <v-layout row class="pb-10">
            <v-flex md8 offset-md2 style="text-align: center">
              <v-combobox
                v-model="selectedMap"
                :items="maps"
                item-text="name"
                label="Выберите карту"
                single-line
                return-object>
              </v-combobox>

            </v-flex>

          </v-layout>
          <v-layout row>
            <v-flex md8 offset-md2 class="headline my-4">
              <p>Это простой конструктор
              </p>
            </v-flex>
          </v-layout>
          <v-layout row>
            <v-flex md8 offset-md2 class="subtitle-1 my-4">
              <p>Выберите точки и постройте путь
              </p>
            </v-flex>
          </v-layout>

          <v-layout row>
            <v-flex md8 offset-md2>
              <l-map :zoom="zoom" v-resize="onResize"
                     :center="center" style="height: 500px; overflow: auto;" @click="addMarker" ref="mymap">
                <l-tile-layer :url="url" :attribution="attribution"/>
                <l-polyline v-for="pol in polylines" :lat-lngs="pol"/>
                <l-geo-json
                  :geojson="specialJson"
                  :options="options"
                  :options-style="styleFunction"
                />
                <l-marker v-for="mark, index in pointsFoundInGeojson" :lat-lng="mark" :icon="selectedIcon">
                  <l-tooltip content="Размеры двери: 2.5м х 1.5" />
                </l-marker>
                <l-marker v-for="mark, index in markers" :lat-lng="mark" @click="removeMarker(index)" :icon="selectedIcon2"></l-marker>

              </l-map>
            </v-flex>
            <v-flex md2 style="text-align: center">
              <v-layout row v-for="(marker,index) in markers">
                <v-flex>
                  Точка {{index}}:{{" " +marker}}
                </v-flex>

              </v-layout>
              <v-layout row>
                <v-flex style="text-align: center">
                  <v-btn @click="getShortPath" :disabled="markers.length===0">Построить путь</v-btn>
                </v-flex>

              </v-layout>
              <v-layout row class="mt-5">
                <v-flex style="text-align: center">
                  <v-btn @click="modalShown" :disabled="polylines.length===0">Сохранить</v-btn>
                </v-flex>
                <v-dialog v-model="dialog" max-width="500px" style="z-index:9999;">
                  <v-card>
                    <v-card-title>
                      <span class="headline">Добавить путь</span>
                    </v-card-title>

                    <v-card-text>
                      <v-container>
                        <v-row>
                          <v-col cols="12" sm="12" md="12">
                            <v-text-field v-model="routeName" label="Имя пути"></v-text-field>
                          </v-col>
                        </v-row>
                        <v-row>
                          <v-col cols="12" sm="12" md="12">
                            <v-combobox
                              :items="detailesTypes"
                              v-model="selectedDetailesTypes"
                              multiple
                              single-line
                              return-object
                              item-text="name"
                              label="Типы деталей"></v-combobox>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-card-text>

                    <v-card-actions>
                      <div class="flex-grow-1"></div>
                      <v-btn text @click="dialog = false">Отмена</v-btn>
                      <v-btn text @click="addRouter">Сохранить</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

              </v-layout>

            </v-flex>

          </v-layout>
          <v-layout row>
            <v-flex md8 offset-md2>
              <v-data-table
                :headers="headers"
                :items="events"
                :items-per-page="5"
                class="elevation-1">

              </v-data-table>
            </v-flex>
          </v-layout>
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>


<script>

  function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
  }

  import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
  import shortestPath from '@turf/shortest-path'
  import {point} from '@turf/helpers'
  import simplify from '@turf/simplify'
  import bez from '@turf/bezier-spline'
  import bbox from '@turf/bbox'


  import L, {latLng} from 'leaflet'
  import {LGeoJson, LMap, LMarker, LPolyline, LTileLayer, LTooltip} from "vue2-leaflet";

  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
  });


  function isInside(pt, geojson) {
    for (var i = 0; i < geojson.features.length; i++) {
      if (booleanPointInPolygon(pt, geojson.features[i])) {
        return geojson.features[i];
      }
    }
    return null;
  }

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  export default {
    name: "MainComponent",
    components: {
      LTooltip,
      LMap,
      LTileLayer,
      LGeoJson,
      LMarker,
      LPolyline
    },
    data: () => (
      {
        events:[],
        timer:'',
        headers:[
          {
            text: 'Дата',
            align: 'left',
            sortable: true,
            value: 'he.date',
          },
          { text: 'Событие', value: 'he.description.title' },
          { text: 'Пользователь', value: 'he.user' },
          { text: 'Тип детали', value: 'dte.name' },
          { text: 'Инд. детали', value: 'dte.id' },
          { text: 'Координаты', value: 'he.coords' },
          { text: 'Путь', value: 're.name' },
        ],
        dialog: false,
        routeName:"",
        selectedIcon: L.icon({
          iconUrl: 'https://cdn2.iconfinder.com/data/icons/mobile-web-apps-1/32/open-512.png',
          shadowUrl: 'http://leafletjs.com/examples/custom-icons/leaf-shadow.png',
          iconSize:     [38, 95],
          shadowSize:   [50, 64],
          iconAnchor:   [22, 94],
          shadowAnchor: [4, 62],
          popupAnchor:  [-3, -76]
        }),
        selectedIcon2: L.icon({
          iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
          shadowUrl: 'http://leafletjs.com/examples/custom-icons/leaf-shadow.png',
          iconSize:     [38, 95],
          shadowSize:   [50, 64],
          iconAnchor:   [22, 94],
          shadowAnchor: [4, 62],
          popupAnchor:  [-3, -76]
        }),
        detailesTypes:[],
        selectedDetailesTypes:[],
        selectedMap: null,
        maps: [{name: "Pavilion123", id: "4712b92a-489e-40f4-b5cc-88527053a309"},
          {name: "Pavilion1234", id: "4712b92a-489e-40f4-b5cc-88527053a309"}],
        selectedLayer: 1,
        layers: [1, 2],
        loading: false,
        myStyle: {
          "opacity": 0
        },
        show: true,
        enableTooltip: true,
        zoom: 20,
        polyline: {},
        center: [55.61575897687, 49.29281446201],
        fillColor: "#e4ce7f",
        url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        marker: latLng(55.61575897687, 49.29281446201),
        markers: [],

        map: null,
        tileLayer: null,
        routers:[],
        jsonForPoints:{},
        polylines:[]
      }),
    computed: {
      specialJson(){
        return this.getPolygons(this.selectedMap.map)
      },
      pointsFoundInGeojson(){
        return this.getPoints(this.jsonForPoints)
      },
      readyForMobilePoly(){
        let result = []
        for (let i = 0; i < this.polylines.length;i++){
          for(let j = 0; j < this.polylines[i].length;j++){
            result.push(this.polylines[i][j])
          }
        }
        return result
      },
      options() {
        return {
          onEachFeature: this.onEachFeatureFunction
        };
      },
      styleFunction() {
        const fillColor = this.fillColor; // important! need touch fillColor in computed for re-calculate when change fillColor
        return () => {
          return {
            weight: 2,
            color: "#f12a2b",
            opacity: 1
          };
        };
      },
      onEachFeatureFunction() {
        if (!this.enableTooltip) {
          return () => {
          };
        }
        return (feature, layer) => {

          layer.bindTooltip(
            "<div>Навазние цеха:" + feature.properties.name +

            "</div><div>Тип помещения: 123 " +

            "</div>",
            {permanent: false, sticky: true}
          );
        };
      }
    },
    mounted() {
      //this.initMap()
    },
    methods: {

      onResize() {
        this.$refs.map.mapObject.invalidateSize();
      },
      getPolygons(geojson) {
        this.jsonForPoints = clone(geojson)
        var a = geojson.features.filter(feature => {
          return feature.geometry.type === "Polygon"
        })
        geojson.features = a
        return geojson
      },
      modalShown() {

        setTimeout(() => {
          this.$refs.mymap.mapObject.invalidateSize();
        }, 100);
        this.dialog = true
      },
      getPoints(geojson) {
        console.log(geojson)
        return geojson.features.filter(feature => {
          return feature.geometry.type === "Point"
        }).map(feature => {
          return latLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
          )
        })
      },
      createPath(pt, geojson, exclude,endPt) {
        if(exclude.filter(obj=>obj.geometry.coordinates[0]===pt.geometry.coordinates[0]&&
          obj.geometry.coordinates[1]===pt.geometry.coordinates[1]).length>3){
          return null
        }
        exclude.push(pt)
        var currentFeature = isInside(pt, geojson)
        if (currentFeature === null) return null;
        else {
          if(booleanPointInPolygon(endPt,currentFeature)){
            return shortestPath(pt,endPt, {
              obstacles: {features:[currentFeature],
              type:"FeatureCollection"},
              resolution: undefined,
              units: 'meters'
            })
          }
          var list = []
          let dd = this.pointsFoundInGeojson.map(obj=>{return point([obj.lng,obj.lat])})
          for(let i=0;i<dd.length;i++){
            if(booleanPointInPolygon(dd[i],currentFeature)){
              var pointToPointPath = shortestPath(pt,dd[i],{
                obstacles: {features:[currentFeature],
                  type:"FeatureCollection"},
                resolution: undefined,
                units: 'meters'
              })
              if(pointToPointPath.geometry.coordinates.filter(obj=>obj===undefined).length>0){
                return null
              }
              list.push(pointToPointPath)
              var recResult = this.createPath(dd[i],geojson,exclude,endPt)
              if(recResult!==null){
                list.push(recResult)
              }
            }
          }
          return list
        }

      },
      drawPolylines(listResults){
        for(var i=0;i<listResults.length;i++){
          if(listResults[i].geometry !== undefined){
            this.polylines.push(listResults[i].geometry.coordinates.map(coord => {
              return {
                lat: coord[1],
                lng: coord[0]
              }
            }))
          }
          else {
            this.drawPolylines(listResults[i])
          }
        }
      },
      getShortPath() {
        console.log(this.specialJson)
        let resultPaths = []


        var options = {
          obstacles: this.specialJson,
          resolution: undefined,
          units: 'meters'
        };
        console.log(Object.values(this.markers[0]).reverse())
        var path = shortestPath(Object.values(this.markers[0]).reverse(), Object.values(this.markers[1]).reverse(), options)

        var listResults = this.createPath(point(Object.values(this.markers[0]).reverse()),this.specialJson,[],
          point(Object.values(this.markers[1]).reverse()))


        console.log("---------------------")
        console.log(listResults)
        this.polylines = []
        if(Array.isArray(listResults)){
          this.drawPolylines(listResults)
        }
        else{
          this.polylines.push(listResults.geometry.coordinates.map(coord => {
            return {
              lat: coord[1],
              lng: coord[0]
            }
          }))
        }


        /*var simplePath = simplify(path, { tolerance: 0.00001 });
        var spline = bez(simplePath, { sharpness: 0.00001 });*/

        this.polyline = path.geometry.coordinates.map(coord => {
          return {
            lat: coord[1],
            lng: coord[0]
          }
        })
        console.log(path)
      },

      removeMarker(index) {
        this.markers.splice(index, 1);
      },
      getMaps(){
        this.$http.post("/api/getMaps").then(res=>{
          console.log(res.data)
          this.maps = res.data
          this.selectedMap = res.data[1]
        })
      },
      getRoutersByMapId(){
        this.$http.post("/api/getRouteByMapId",{
          mapId: this.selectedMap.id
        }).then(res=>{
          this.routers = res.data
        })
        this.getKingReq()
      },
      getDetailesTypes(){
        this.$http.post("/api/getDetailType").then(res=>{
          this.detailesTypes = res.data
        })
      },
      addRouter() {
        this.$http.post("/api/addRoute", {
          id: uuidv4(),
          name: this.routeName,
          mapId: this.selectedMap.id,
          route: {
            path: this.readyForMobilePoly,
            doors: this.pointsFoundInGeojson
          },
          detailTypeIds: this.selectedDetailesTypes.map(d=>d.id),
        }).then(res=>{
          this.dialog = false
          this.getRoutersByMapId()
        })
      },
      addMarker(event) {
        console.log(event)
        this.markers.push(event.latlng);
      },
      parseISOString(s) {
        var options = { day: 'numeric', month: 'long', year: 'numeric' };
        var b = s.split(/\D+/);
        return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6])).toLocaleDateString('ru-RU', options) + " " + new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6])).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) ;
      },
      getKingReq(){
        this.$http.post("/api/getKingRequest").then(res=>{
          console.log(res.data)
          this.events = res.data.map(obj=>{
            obj.he.coords = obj.he.location.lat + ",\n" +  obj.he.location.lng
            obj.he.date = this.parseISOString(obj.he.date)
            return obj
          })

        })
      },
      getBbox(){
        let a = bbox(this.specialJson)
        this.markers.push(latLng(a[1],a[0]))
        this.markers.push(latLng(a[3],a[2]))

      }
    },
    created() {

      setInterval(() => {
        this.getKingReq()
      }, 1000)

      //this.geojson = require("./expo2.json")
      this.getMaps()
      setTimeout(()=>{
        this.getRoutersByMapId()
      },1000)
      this.getDetailesTypes()



      /*console.log(this.geojson)
      let a = this.geojson*/
      /*this.pointsFoundInGeojson = this.getPoints(a)
      console.log(this.pointsFoundInGeojson)*/
      /*let b = this.geojson
      console.log(this.getPolygons(b))*/

    }
  }
</script>

<style scoped>

  @import "~leaflet/dist/leaflet.css";

  .map {
    height: 600px
  }

  .Select-menu-outer {
    top: auto;
    bottom: 100%
  }
</style>
