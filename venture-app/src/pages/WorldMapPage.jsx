import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { COUNTRY_DATA } from '../data/countries'
import { C, CONTINENT_COLORS } from '../data/colors'
import AuthModal from '../components/AuthModal'

const WIDTH = 960
const HEIGHT = 500
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const YEARS = Array.from({ length: 30 }, (_, i) => 2026 - i)

// ─── Region/City data for structured location picker ────────
const REGION_DATA = {
  "840": { regions: [
    { name: "Alabama", cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile"] },
    { name: "Alaska", cities: ["Anchorage", "Fairbanks", "Juneau"] },
    { name: "Arizona", cities: ["Phoenix", "Mesa", "Scottsdale", "Tucson"] },
    { name: "Arkansas", cities: ["Little Rock", "Fort Smith", "Fayetteville"] },
    { name: "California", cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland"] },
    { name: "Colorado", cities: ["Denver", "Colorado Springs", "Boulder", "Aspen"] },
    { name: "Connecticut", cities: ["Bridgeport", "Hartford", "New Haven", "Stamford"] },
    { name: "Delaware", cities: ["Wilmington", "Dover", "Newark"] },
    { name: "District of Columbia", cities: ["Washington"] },
    { name: "Florida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"] },
    { name: "Georgia", cities: ["Atlanta", "Savannah", "Augusta", "Columbus"] },
    { name: "Hawaii", cities: ["Honolulu", "Hilo", "Kailua", "Maui"] },
    { name: "Idaho", cities: ["Boise", "Meridian", "Pocatello", "Idaho Falls"] },
    { name: "Illinois", cities: ["Chicago", "Springfield", "Peoria", "Rockford"] },
    { name: "Indiana", cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend"] },
    { name: "Iowa", cities: ["Des Moines", "Cedar Rapids", "Davenport", "Dubuque"] },
    { name: "Kansas", cities: ["Kansas City", "Wichita", "Topeka", "Overland Park"] },
    { name: "Kentucky", cities: ["Louisville", "Lexington", "Bowling Green"] },
    { name: "Louisiana", cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"] },
    { name: "Maine", cities: ["Portland", "Lewiston", "Bangor"] },
    { name: "Maryland", cities: ["Baltimore", "Annapolis", "Columbia", "Silver Spring"] },
    { name: "Massachusetts", cities: ["Boston", "Worcester", "Springfield", "Cambridge"] },
    { name: "Michigan", cities: ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing"] },
    { name: "Minnesota", cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth"] },
    { name: "Mississippi", cities: ["Jackson", "Gulfport", "Biloxi", "Hattiesburg"] },
    { name: "Missouri", cities: ["St. Louis", "Kansas City", "Springfield", "Jefferson City"] },
    { name: "Montana", cities: ["Billings", "Missoula", "Great Falls", "Bozeman"] },
    { name: "Nebraska", cities: ["Omaha", "Lincoln", "Bellevue"] },
    { name: "Nevada", cities: ["Las Vegas", "Henderson", "Reno"] },
    { name: "New Hampshire", cities: ["Manchester", "Nashua", "Concord"] },
    { name: "New Jersey", cities: ["Newark", "Jersey City", "Paterson", "Elizabeth"] },
    { name: "New Mexico", cities: ["Albuquerque", "Las Cruces", "Santa Fe"] },
    { name: "New York", cities: ["New York City", "Buffalo", "Albany", "Rochester", "Syracuse"] },
    { name: "North Carolina", cities: ["Charlotte", "Raleigh", "Greensboro", "Durham"] },
    { name: "North Dakota", cities: ["Bismarck", "Fargo", "Grand Forks"] },
    { name: "Ohio", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo"] },
    { name: "Oklahoma", cities: ["Oklahoma City", "Tulsa", "Norman"] },
    { name: "Oregon", cities: ["Portland", "Eugene", "Salem", "Bend"] },
    { name: "Pennsylvania", cities: ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg"] },
    { name: "Rhode Island", cities: ["Providence", "Warwick", "Cranston"] },
    { name: "South Carolina", cities: ["Charleston", "Columbia", "Greenville"] },
    { name: "South Dakota", cities: ["Sioux Falls", "Rapid City", "Pierre"] },
    { name: "Tennessee", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga"] },
    { name: "Texas", cities: ["Houston", "Dallas", "San Antonio", "Austin", "Fort Worth", "El Paso"] },
    { name: "Utah", cities: ["Salt Lake City", "Provo", "Park City", "Orem"] },
    { name: "Vermont", cities: ["Burlington", "Montpelier", "Rutland"] },
    { name: "Virginia", cities: ["Virginia Beach", "Richmond", "Arlington", "Norfolk"] },
    { name: "Washington", cities: ["Seattle", "Spokane", "Tacoma", "Olympia"] },
    { name: "West Virginia", cities: ["Charleston", "Huntington", "Parkersburg"] },
    { name: "Wisconsin", cities: ["Milwaukee", "Madison", "Green Bay"] },
    { name: "Wyoming", cities: ["Cheyenne", "Casper", "Laramie", "Jackson"] },
  ]},
  "826": { regions: [
    { name: "England", cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol"] },
    { name: "Scotland", cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"] },
    { name: "Wales", cities: ["Cardiff", "Swansea", "Newport"] },
    { name: "Northern Ireland", cities: ["Belfast", "Derry", "Lisburn"] },
  ]},
  "250": { regions: [
    { name: "Île-de-France", cities: ["Paris", "Versailles"] },
    { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Cannes", "Toulon"] },
    { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Grenoble", "Chamonix"] },
    { name: "Nouvelle-Aquitaine", cities: ["Bordeaux", "Limoges", "Poitiers"] },
    { name: "Occitanie", cities: ["Toulouse", "Montpellier", "Nîmes"] },
    { name: "Brittany", cities: ["Rennes", "Brest", "Saint-Malo"] },
    { name: "Normandy", cities: ["Rouen", "Caen", "Le Havre"] },
  ]},
  "380": { regions: [
    { name: "Lombardy", cities: ["Milan", "Como", "Brescia", "Bergamo"] },
    { name: "Lazio", cities: ["Rome", "Frascati", "Tivoli"] },
    { name: "Tuscany", cities: ["Florence", "Siena", "Pisa", "Lucca"] },
    { name: "Veneto", cities: ["Venice", "Verona", "Padua"] },
    { name: "Campania", cities: ["Naples", "Salerno", "Amalfi", "Capri"] },
    { name: "Sicily", cities: ["Palermo", "Catania", "Taormina"] },
    { name: "Emilia-Romagna", cities: ["Bologna", "Parma", "Modena", "Rimini"] },
  ]},
  "392": { regions: [
    { name: "Tokyo", cities: ["Tokyo", "Shibuya", "Shinjuku", "Akihabara"] },
    { name: "Osaka", cities: ["Osaka", "Kobe", "Sakai"] },
    { name: "Kyoto", cities: ["Kyoto", "Uji", "Arashiyama"] },
    { name: "Hokkaido", cities: ["Sapporo", "Asahikawa", "Otaru"] },
    { name: "Okinawa", cities: ["Naha", "Okinawa City", "Chatan"] },
    { name: "Kanagawa", cities: ["Yokohama", "Kawasaki", "Kamakura"] },
    { name: "Hiroshima", cities: ["Hiroshima", "Onomichi", "Miyajima"] },
  ]},
  "484": { regions: [
    { name: "Mexico City", cities: ["Mexico City", "Coyoacán", "Polanco"] },
    { name: "Quintana Roo", cities: ["Cancún", "Playa del Carmen", "Tulum"] },
    { name: "Jalisco", cities: ["Guadalajara", "Puerto Vallarta", "Zapopan"] },
    { name: "Baja California", cities: ["Tijuana", "Ensenada", "Mexicali"] },
    { name: "Oaxaca", cities: ["Oaxaca City", "Huatulco", "Playa del Carmen"] },
    { name: "Yucatán", cities: ["Mérida", "Valladolid", "Chichén Itzá"] },
  ]},
  "076": { regions: [
    { name: "São Paulo", cities: ["São Paulo", "Campinas", "Santos"] },
    { name: "Rio de Janeiro", cities: ["Rio de Janeiro", "Niterói", "Búzios"] },
    { name: "Bahia", cities: ["Salvador", "Porto Seguro", "Feira de Santana"] },
    { name: "Minas Gerais", cities: ["Belo Horizonte", "Ouro Preto", "Uberlândia"] },
    { name: "Distrito Federal", cities: ["Brasília"] },
    { name: "Amazonas", cities: ["Manaus", "Parintins"] },
  ]},
  "036": { regions: [
    { name: "New South Wales", cities: ["Sydney", "Newcastle", "Wollongong", "Byron Bay"] },
    { name: "Victoria", cities: ["Melbourne", "Geelong", "Ballarat"] },
    { name: "Queensland", cities: ["Brisbane", "Gold Coast", "Cairns"] },
    { name: "Western Australia", cities: ["Perth", "Fremantle", "Broome"] },
    { name: "South Australia", cities: ["Adelaide", "Barossa Valley"] },
    { name: "Tasmania", cities: ["Hobart", "Launceston"] },
    { name: "Northern Territory", cities: ["Darwin", "Alice Springs"] },
    { name: "ACT", cities: ["Canberra"] },
  ]},
  "124": { regions: [
    { name: "Ontario", cities: ["Toronto", "Ottawa", "Hamilton", "Niagara Falls"] },
    { name: "Quebec", cities: ["Montreal", "Quebec City", "Laval"] },
    { name: "British Columbia", cities: ["Vancouver", "Victoria", "Whistler", "Kelowna"] },
    { name: "Alberta", cities: ["Calgary", "Edmonton", "Banff", "Jasper"] },
    { name: "Manitoba", cities: ["Winnipeg", "Brandon"] },
    { name: "Saskatchewan", cities: ["Saskatoon", "Regina"] },
    { name: "Nova Scotia", cities: ["Halifax", "Cape Breton"] },
  ]},
  "276": { regions: [
    { name: "Bavaria", cities: ["Munich", "Nuremberg", "Augsburg"] },
    { name: "Berlin", cities: ["Berlin"] },
    { name: "North Rhine-Westphalia", cities: ["Cologne", "Düsseldorf", "Dortmund", "Essen"] },
    { name: "Baden-Württemberg", cities: ["Stuttgart", "Freiburg", "Heidelberg"] },
    { name: "Hesse", cities: ["Frankfurt", "Wiesbaden", "Darmstadt"] },
    { name: "Saxony", cities: ["Leipzig", "Dresden"] },
    { name: "Hamburg", cities: ["Hamburg"] },
  ]},
  "724": { regions: [
    { name: "Catalonia", cities: ["Barcelona", "Girona", "Tarragona"] },
    { name: "Madrid", cities: ["Madrid", "Alcalá de Henares"] },
    { name: "Andalusia", cities: ["Seville", "Málaga", "Granada", "Córdoba"] },
    { name: "Basque Country", cities: ["Bilbao", "San Sebastián", "Vitoria-Gasteiz"] },
    { name: "Valencia", cities: ["Valencia", "Alicante"] },
    { name: "Galicia", cities: ["Santiago de Compostela", "Vigo", "A Coruña"] },
    { name: "Balearic Islands", cities: ["Palma", "Ibiza"] },
    { name: "Canary Islands", cities: ["Tenerife", "Las Palmas", "Lanzarote"] },
  ]},
  "356": { regions: [
    { name: "Delhi", cities: ["New Delhi", "Old Delhi"] },
    { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur"] },
    { name: "Karnataka", cities: ["Bangalore", "Mysore", "Hampi"] },
    { name: "Tamil Nadu", cities: ["Chennai", "Madurai", "Pondicherry"] },
    { name: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Jaisalmer"] },
    { name: "Uttar Pradesh", cities: ["Agra", "Varanasi", "Lucknow"] },
    { name: "West Bengal", cities: ["Kolkata", "Darjeeling", "Siliguri"] },
    { name: "Kerala", cities: ["Kochi", "Thiruvananthapuram", "Munnar"] },
    { name: "Goa", cities: ["Panaji", "Margao", "Calangute"] },
  ]},
  "764": { regions: [
    { name: "Bangkok", cities: ["Bangkok", "Nonthaburi"] },
    { name: "Northern Thailand", cities: ["Chiang Mai", "Chiang Rai", "Pai"] },
    { name: "Southern Thailand", cities: ["Phuket", "Krabi", "Koh Samui", "Hat Yai"] },
    { name: "Central Thailand", cities: ["Ayutthaya", "Kanchanaburi"] },
    { name: "Eastern Thailand", cities: ["Pattaya", "Koh Chang", "Rayong"] },
    { name: "Northeastern Thailand", cities: ["Khon Kaen", "Udon Thani", "Nakhon Ratchasima"] },
  ]},
  "410": { regions: [
    { name: "Seoul", cities: ["Seoul", "Gangnam", "Hongdae", "Itaewon"] },
    { name: "Gyeonggi", cities: ["Suwon", "Incheon", "Seongnam"] },
    { name: "Busan", cities: ["Busan", "Haeundae"] },
    { name: "Jeju", cities: ["Jeju City", "Seogwipo"] },
    { name: "Gangwon", cities: ["Chuncheon", "Sokcho", "Gangneung"] },
  ]},
}

// ─── Country center coordinates [lng, lat] for search-zoom ──
const COUNTRY_COORDS = {
  "004": [67, 33], "008": [20, 41], "012": [3, 28], "024": [17.5, -12.5],
  "032": [-64, -34], "031": [48, 40.5], "036": [134, -25], "040": [14.5, 47.5],
  "051": [45, 40], "044": [-77, 25], "050": [90, 24], "112": [28, 53.5],
  "056": [4.5, 50.8], "084": [-88.5, 17.2], "204": [2.3, 9.3], "064": [90.5, 27.5],
  "068": [-65, -17], "070": [17.8, 44], "072": [24, -22], "076": [-51, -14],
  "096": [114.7, 4.5], "100": [25.5, 43], "854": [-1.5, 12.3], "108": [29.9, -3.4],
  "116": [105, 12.5], "120": [12.3, 6], "124": [-96, 56], "140": [21, 6.6],
  "148": [19, 15.5], "152": [-71, -35], "156": [104, 35], "170": [-73.5, 4],
  "180": [24, -2.5], "178": [15.8, -0.7], "188": [-84, 10], "191": [16.5, 45],
  "192": [-79.5, 22], "196": [33.4, 35.1], "203": [15.5, 49.8], "208": [10, 56],
  "262": [42.6, 11.5], "214": [-70, 19], "218": [-78.5, -1.8], "818": [30, 27],
  "222": [-89, 13.8], "226": [10.3, 1.7], "232": [39, 15.3], "233": [25, 59],
  "748": [31.5, -26.5], "231": [39.5, 9], "242": [178, -17.8], "246": [26, 64],
  "250": [2.5, 46.5], "266": [11.8, -0.8], "270": [-15.4, 13.4], "268": [43.5, 42],
  "276": [10.5, 51.2], "288": [-1.2, 7.9], "300": [22, 39], "320": [-90.2, 15.5],
  "324": [-11.8, 10.8], "624": [-15, 12], "328": [-59, 5], "332": [-72.3, 19],
  "340": [-86.5, 14.5], "348": [19.5, 47.2], "352": [-19, 65], "356": [79, 22],
  "360": [118, -2], "364": [53, 33], "368": [44, 33.2], "372": [-8, 53.4],
  "376": [35, 31.5], "380": [12.5, 42.5], "384": [-5.5, 7.5], "388": [-77.3, 18.1],
  "392": [138, 36], "400": [36.8, 31], "398": [67, 48.5], "404": [38, 0.5],
  "414": [47.5, 29.3], "417": [74.5, 41], "418": [103, 18.2], "428": [24.5, 57],
  "422": [35.8, 34], "426": [28.5, -29.5], "430": [-9.5, 6.4], "434": [17, 27],
  "440": [24, 55.2], "442": [6.1, 49.8], "450": [47, -19], "454": [34, -13.5],
  "458": [109, 4], "466": [-2, 17.5], "478": [-10.5, 20.3], "484": [-102, 23.5],
  "498": [28.5, 47], "496": [104, 46.5], "499": [19.3, 42.7], "504": [-7, 32],
  "508": [35, -18.5], "104": [97, 20], "516": [18, -22], "524": [84, 28],
  "528": [5.3, 52.1], "554": [172, -41], "558": [-85, 13], "562": [9, 17.5],
  "566": [8, 9.5], "408": [127, 40], "807": [21.7, 41.5], "578": [9, 62],
  "512": [56, 21], "586": [69, 30], "275": [35.2, 31.9], "591": [-80, 9],
  "598": [147, -6.5], "600": [-58, -23], "604": [-76, -10], "608": [122, 12.5],
  "616": [20, 52], "620": [-8, 39.5], "634": [51.2, 25.3], "642": [25, 46],
  "643": [55, 60], "646": [29.9, -2], "682": [45, 24], "686": [-14.5, 14.5],
  "688": [21, 44], "694": [-11.8, 8.5], "703": [19.5, 48.7], "705": [14.5, 46.1],
  "706": [46, 5], "710": [25, -29], "410": [128, 36], "728": [30, 7.5],
  "724": [-3.7, 40.4], "144": [81, 7.9], "729": [30, 16], "740": [-56, 4],
  "752": [16, 63], "756": [8.2, 46.8], "760": [38.5, 35], "158": [121, 23.7],
  "762": [69, 38.5], "834": [34.5, -6.3], "764": [101, 14], "626": [126, -8.9],
  "768": [1.2, 8.6], "780": [-61, 10.5], "788": [9.5, 34], "792": [35.2, 39.9],
  "795": [59, 39], "784": [54, 24], "800": [32.3, 1.4], "804": [32, 49],
  "826": [-2, 54], "840": [-98, 39], "858": [-56, -33], "860": [64.5, 41.3],
  "862": [-66.6, 7], "704": [107, 16], "887": [48, 15.5], "894": [28, -14],
  "716": [29.8, -19.8],
}

// ─── Image Compression Helper ───────────────────────────────
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        let w = img.width, h = img.height
        const maxW = 800, maxH = 800
        if (w > h) { if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW } }
        else { if (h > maxH) { w = Math.round(w * (maxH / h)); h = maxH } }
        canvas.width = w; canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
    }
  })
}

// ─── Gamification Functions ─────────────────────────────────
function calculateXP(visited, memories) {
  let xp = 0
  visited.forEach(id => {
    xp += 10
    if (memories[id]?.note) xp += 15
    if (memories[id]?.date || (memories[id]?.month && memories[id]?.year)) xp += 5
    if (memories[id]?.location || memories[id]?.region || memories[id]?.customLocation) xp += 5
    if (memories[id]?.photos?.length > 0) xp += 20
  })
  return xp
}

function getTitle(xp) {
  if (xp >= 500) return "World Wanderer"
  if (xp >= 300) return "Seasoned Explorer"
  if (xp >= 150) return "Curious Traveler"
  if (xp >= 50) return "First Steps"
  return "Dreamer"
}

function getTier(count) {
  if (count >= 100) return { name: "Diamond", icon: "💎", color: "#B9F2FF", colorSolid: "#7DD3E8", colorBg: "#E8FAFE", next: null, threshold: 100 }
  if (count >= 50) return { name: "Platinum", icon: "⚜️", color: "#E8E0F0", colorSolid: "#9B7FC4", colorBg: "#F5F0FA", next: 100, threshold: 50 }
  if (count >= 30) return { name: "Gold", icon: "🥇", color: "#FFE4A0", colorSolid: "#D4A520", colorBg: "#FFF8E7", next: 50, threshold: 30 }
  if (count >= 15) return { name: "Silver", icon: "🥈", color: "#E0E4E8", colorSolid: "#8A95A5", colorBg: "#F4F6F8", next: 30, threshold: 15 }
  if (count >= 5) return { name: "Bronze", icon: "🥉", color: "#F0D5B8", colorSolid: "#B87333", colorBg: "#FAF0E6", next: 15, threshold: 5 }
  return { name: "Starter", icon: "🗺️", color: "#E8E8E8", colorSolid: "#999", colorBg: "#F5F5F5", next: 5, threshold: 0 }
}

// ─── Regional Collections ────────────────────────────────────
const COLLECTIONS = [
  { id: "europe", name: "European Grand Tour", icon: "🏰", desc: "Master the old continent", desc: "Master the old continent", continent: "Europe", target: 10 },
  { id: "asia", name: "Silk Road Explorer", icon: "🐉", desc: "Journey through the East", continent: "Asia", target: 8 },
  { id: "africa", name: "African Safari", icon: "🦁", desc: "Discover the motherland", continent: "Africa", target: 8 },
  { id: "namerica", name: "Americas Pioneer", icon: "🦅", desc: "Coast to coast and beyond", continent: "North America", target: 6 },
  { id: "samerica", name: "South American Spirit", icon: "🌿", desc: "Rhythm, nature, and wonder", continent: "South America", target: 5 },
  { id: "oceania", name: "Pacific Voyager", icon: "🌊", desc: "Islands of the endless blue", continent: "Oceania", target: 3 },
]

function getCollectionProgress(visitedSet) {
  return COLLECTIONS.map(col => {
    const countriesInRegion = Object.entries(COUNTRY_DATA).filter(([, c]) => c.continent === col.continent)
    const visitedInRegion = countriesI