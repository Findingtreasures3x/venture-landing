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
    { name: "Oaxaca", cities: ["Oaxaca City", "Huatulco", "Puerto Escondido"] },
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
  { id: "europe", name: "European Grand Tour", icon: "🏰", desc: "Master the old continent", continent: "Europe", target: 10 },
  { id: "asia", name: "Silk Road Explorer", icon: "🐉", desc: "Journey through the East", continent: "Asia", target: 8 },
  { id: "africa", name: "African Safari", icon: "🦁", desc: "Discover the motherland", continent: "Africa", target: 8 },
  { id: "namerica", name: "Americas Pioneer", icon: "🦅", desc: "Coast to coast and beyond", continent: "North America", target: 6 },
  { id: "samerica", name: "South American Spirit", icon: "🌿", desc: "Rhythm, nature, and wonder", continent: "South America", target: 5 },
  { id: "oceania", name: "Pacific Voyager", icon: "🌊", desc: "Islands of the endless blue", continent: "Oceania", target: 3 },
]

function getCollectionProgress(visitedSet) {
  return COLLECTIONS.map(col => {
    const countriesInRegion = Object.entries(COUNTRY_DATA).filter(([, c]) => c.continent === col.continent)
    const visitedInRegion = countriesInRegion.filter(([id]) => visitedSet.has(id))
    const progress = Math.min(visitedInRegion.length, col.target)
    return { ...col, progress, total: countriesInRegion.length, completed: progress >= col.target, visitedList: visitedInRegion }
  })
}

// ─── Memory Quality Score ────────────────────────────────────
function getMemoryScore(memory) {
  if (!memory) return { score: 0, level: "empty", stars: 0, label: "No memory" }
  let pts = 0
  if (memory.note) pts++
  if (memory.location || memory.region || memory.customLocation) pts++
  if (memory.date || (memory.month && memory.year)) pts++
  if (memory.photos?.length > 0) pts++
  if (memory.photos?.length >= 3) pts++
  const levels = [
    { level: "empty", stars: 0, label: "No memory" },
    { level: "basic", stars: 1, label: "Stamped" },
    { level: "developing", stars: 2, label: "Noted" },
    { level: "solid", stars: 3, label: "Detailed" },
    { level: "rich", stars: 4, label: "Rich Memory" },
    { level: "complete", stars: 5, label: "Complete Memory" },
  ]
  return { score: pts, ...levels[pts] }
}

// ─── Sticker Evolution ───────────────────────────────────────
function getStickerLevel(memory) {
  if (!memory) return 0
  const hasNote = !!memory.note
  const hasLocation = !!(memory.location || memory.region || memory.customLocation)
  const hasDate = !!(memory.date || (memory.month && memory.year))
  const manyPhotos = (memory.photos?.length || 0) >= 3
  if (hasNote && hasLocation && hasDate && manyPhotos) return 3
  if (hasNote && hasLocation && hasDate) return 2
  if (hasNote || hasLocation) return 1
  return 0
}

const stickerStyles = [
  (color) => ({ border: `2px dashed ${color}40`, background: `${color}08`, boxShadow: "none" }),
  (color) => ({ border: `2.5px solid ${color}50`, background: `${color}12`, boxShadow: `0 2px 8px ${color}15` }),
  (color) => ({ border: `3px solid ${color}70`, background: `linear-gradient(135deg, ${color}15, ${color}08)`, boxShadow: `0 4px 16px ${color}20` }),
  (color) => ({ border: `3px solid ${color}`, background: `linear-gradient(135deg, ${color}20, #fff, ${color}15)`, boxShadow: `0 4px 20px ${color}30, inset 0 1px 2px rgba(255,255,255,0.6)`, animation: "holographicShimmer 3s ease infinite" }),
]

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function WorldMapPage() {
  const navigate = useNavigate()
  const { session, passportId } = useAuth()
  const [worldData, setWorldData] = useState(null)
  const [visited, setVisited] = useState(new Set())
  const [memories, setMemories] = useState({})
  const [hovered, setHovered] = useState(null)
  const [lastUnlocked, setLastUnlocked] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [showMemoryModal, setShowMemoryModal] = useState(null)
  const [memoryDraft, setMemoryDraft] = useState({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] })
  const [showShareCard, setShowShareCard] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [passportPage, setPassportPage] = useState(0)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const mapRef = useRef(null)
  const fileInputRef = useRef(null)

  const projection = useMemo(() => geoNaturalEarth1().scale(155).translate([WIDTH / 2, HEIGHT / 2]), [])
  const pathGenerator = useMemo(() => geoPath(projection), [projection])

  // ─── Derived state ───
  const conts = useMemo(() => new Set([...visited].map(id => COUNTRY_DATA[id]?.continent).filter(Boolean)), [visited])
  const xp = useMemo(() => calculateXP(visited, memories), [visited, memories])
  const title = useMemo(() => getTitle(xp), [xp])
  const tier = useMemo(() => getTier(visited.size), [visited])
  const collections = useMemo(() => getCollectionProgress(visited), [visited])

  const visitedArr = useMemo(() => {
    return [...visited].filter(id => COUNTRY_DATA[id]).map(id => ({ id, ...COUNTRY_DATA[id], memory: memories[id] })).sort((a, b) => {
      const parseDate = (m) => {
        if (!m || !m.date) return 0
        const parts = (m.date || '').split(' ')
        const monthIdx = MONTHS.indexOf(parts[0])
        const year = parseInt(parts[1] || parts[0])
        if (isNaN(year)) return 0
        return year * 12 + (monthIdx >= 0 ? monthIdx : 0)
      }
      const da = parseDate(a.memory), db = parseDate(b.memory)
      if (da === 0 && db === 0) return 0
      if (da === 0) return 1
      if (db === 0) return -1
      return db - da
    })
  }, [visited, memories])

  // Auth check
  useEffect(() => { setAuthChecked(true) }, [session])

  // Load data
  useEffect(() => {
    if (!authChecked) return
    if (session && passportId) loadFromSupabase()
    else if (!session) loadFromLocalStorage()
  }, [authChecked, session, passportId])

  async function loadFromSupabase() {
    try {
      const { data: vc } = await supabase.from('visited_countries').select('country_code').eq('passport_id', passportId)
      setVisited(new Set((vc || []).map(r => r.country_code)))
      const { data: mems } = await supabase.from('memories').select('*').eq('passport_id', passportId)
      const memObj = {}
      for (const m of (mems || [])) {
        memObj[m.country_code] = {
          note: m.note || '', location: m.custom_location || (m.region && m.city ? `${m.city}, ${m.region}` : m.region || ''),
          date: m.travel_date || '', region: m.region || '', city: m.city || '',
          customLocation: m.custom_location || '', month: (m.travel_date || '').split(' ')[0] || '',
          year: (m.travel_date || '').split(' ')[1] || '', photos: [],
        }
      }
      if (mems && mems.length > 0) {
        const { data: photos } = await supabase.from('memory_photos').select('memory_id, storage_path, display_order').in('memory_id', mems.map(m => m.id)).order('display_order')
        for (const p of (photos || [])) {
          const mem = mems.find(m => m.id === p.memory_id)
          if (mem && memObj[mem.country_code]) {
            const { data: signedData } = await supabase.storage.from('memory-photos').createSignedUrl(p.storage_path, 3600)
            if (signedData?.signedUrl) memObj[mem.country_code].photos.push(signedData.signedUrl)
          }
        }
      }
      setMemories(memObj)
      setDataLoaded(true)
    } catch (err) { console.error('Error loading data:', err); setDataLoaded(true) }
  }

  function loadFromLocalStorage() {
    try { const v = localStorage.getItem('VENTURE_visited'); if (v) setVisited(new Set(JSON.parse(v))) } catch {}
    try { const m = localStorage.getItem('VENTURE_memories'); if (m) setMemories(JSON.parse(m)) } catch {}
    setDataLoaded(true)
  }

  // Load world topojson
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topology => setWorldData(feature(topology, topology.objects.countries)))
      .catch(err => console.error('Failed to load world data:', err))
  }, [])

  // Persist localStorage for guests
  useEffect(() => { if (!dataLoaded || session) return; try { localStorage.setItem('VENTURE_visited', JSON.stringify([...visited])) } catch {} }, [visited, session, dataLoaded])
  useEffect(() => { if (!dataLoaded || session) return; try { localStorage.setItem('VENTURE_memories', JSON.stringify(memories)) } catch {} }, [memories, session, dataLoaded])

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(Object.entries(COUNTRY_DATA).filter(([, c]) => c.name.toLowerCase().includes(q) || c.continent.toLowerCase().includes(q)).slice(0, 8).map(([id, c]) => ({ id, ...c })))
  }, [searchQuery])

  // Pre-populate memory draft
  useEffect(() => {
    if (showMemoryModal && memories[showMemoryModal]) {
      const ex = memories[showMemoryModal]
      setMemoryDraft({ note: ex.note || '', region: ex.region || '', city: ex.city || '', customLocation: ex.customLocation || '', month: ex.month || '', year: ex.year || '', photos: ex.photos || [] })
    }
  }, [showMemoryModal, memories])

  // Zoom handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = mapRef.current?.getBoundingClientRect(); if (!rect) return
    const mx = (e.clientX - rect.left) / rect.width * WIDTH, my = (e.clientY - rect.top) / rect.height * HEIGHT
    const delta = e.deltaY > 0 ? 0.85 : 1.18
    setTransform(prev => { const nk = Math.max(1, Math.min(8, prev.k * delta)); const r = nk / prev.k; return { k: nk, x: mx - r * (mx - prev.x), y: my - r * (my - prev.y) } })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (transform.k <= 1) return
    const rect = mapRef.current?.getBoundingClientRect(); if (!rect) return
    const vx = (e.clientX - rect.left) / rect.width * WIDTH, vy = (e.clientY - rect.top) / rect.height * HEIGHT
    setIsDragging(true); setDragStart({ x: vx - transform.x, y: vy - transform.y })
  }, [transform])

  const handleMouseMove = useCallback((e) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!isDragging || !dragStart || !rect) return
    const vx = (e.clientX - rect.left) / rect.width * WIDTH, vy = (e.clientY - rect.top) / rect.height * HEIGHT
    setTransform(prev => ({ ...prev, x: vx - dragStart.x, y: vy - dragStart.y }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => { setIsDragging(false); setDragStart(null) }, [])
  const resetZoom = () => setTransform({ x: 0, y: 0, k: 1 })

  // Focus country from search
  const focusCountry = useCallback((id) => {
    if (!worldData) return
    const coords = COUNTRY_COORDS[id]
    if (coords) {
      const svgPt = projection(coords)
      if (svgPt && !isNaN(svgPt[0])) {
        const k = 3.5
        setTransform({ k, x: WIDTH / 2 - svgPt[0] * k, y: HEIGHT / 2 - svgPt[1] * k })
      }
    }
    setHovered(id); setShowSearch(false); setSearchQuery('')
  }, [worldData, projection])

  const handleCountryClick = useCallback((id) => {
    if (isDragging) return
    if (!COUNTRY_DATA[id]) return
    setVisited(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setMemories(m => { const n = { ...m }; delete n[id]; return n })
        if (session && passportId) {
          supabase.from('visited_countries').delete().eq('passport_id', passportId).eq('country_code', id)
          supabase.from('memories').delete().eq('passport_id', passportId).eq('country_code', id)
        }
      } else {
        next.add(id)
        setLastUnlocked(id); setShowToast(true)
        setTimeout(() => setShowToast(false), 3500)
        setTimeout(() => setShowMemoryModal(id), 600)
        if (session && passportId) {
          supabase.from('visited_countries').upsert({ passport_id: passportId, country_code: id, added_by: session?.user?.id }, { onConflict: 'passport_id,country_code' })
        }
      }
      return next
    })
  }, [isDragging, session, passportId])

  const saveMemory = async (id) => {
    const { note, region, city, customLocation, month, year, photos } = memoryDraft
    const location = customLocation || (region && city ? `${city}, ${region}` : region || '')
    const date = month && year ? `${month} ${year}` : year || ''
    if (note || location || date || (photos && photos.length > 0)) {
      setMemories(prev => ({ ...prev, [id]: { ...prev[id], note, location, date, region, city, customLocation, month, year, photos: photos || [] } }))
      if (session && passportId) {
        try {
          await supabase.from('memories').upsert({
            passport_id: passportId, country_code: id, note: note || null,
            travel_date: date || null, region: region || null, city: city || null,
            custom_location: customLocation || location || null, added_by: session.user.id,
          }, { onConflict: 'passport_id,country_code' })
        } catch (err) { console.error('Save memory error:', err) }
      }
    }
    setShowMemoryModal(null)
    setMemoryDraft({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] })
  }

  const getCountryColor = (id) => {
    const info = COUNTRY_DATA[id]
    if (!info) return C.land
    if (visited.has(id)) return CONTINENT_COLORS[info.continent] || C.accent
    if (hovered === id) return C.landHover
    return C.land
  }

  const unlockedC = lastUnlocked ? COUNTRY_DATA[lastUnlocked] : null

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ─── Keyframe animations ─── */}
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes holographicShimmer { 0% { filter: hue-rotate(0deg) brightness(1); } 50% { filter: hue-rotate(15deg) brightness(1.05); } 100% { filter: hue-rotate(0deg) brightness(1); } }
        input:focus, textarea:focus, select:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px rgba(91,140,90,0.1) !important; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>

      {/* ─── Auth Modal ─── */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}

      {/* ─── Top Bar ─── */}
      <div style={{ width: '100%', maxWidth: 960, padding: '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width={20} height={24} viewBox="0 0 100 120" fill="none" stroke={C.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10 L50 75 L85 10" /><ellipse cx="50" cy="95" rx="20" ry="8" />
          </svg>
          <span style={{ color: C.accent, fontWeight: 800, fontSize: 15, letterSpacing: '0.1em' }}>VENTURE</span>
        </div>
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: C.textSoft, fontWeight: 500 }}>{session.user.user_metadata?.full_name || session.user.email?.split('@')[0]}</span>
            <button onClick={async () => { await supabase.auth.signOut() }} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.textSoft, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign Out</button>
          </div>
        ) : (
          <button onClick={() => setShowAuthModal(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(91,140,90,0.2)' }}>Sign In</button>
        )}
      </div>

      {/* ─── Header ─── */}
      <div style={{ padding: '16px 16px 0', textAlign: 'center', width: '100%', maxWidth: 960 }}>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: 0, color: C.text, lineHeight: 1.2 }}>Your World Map</h1>
        <p style={{ color: C.textSoft, fontSize: 14, margin: '8px 0 0', fontWeight: 400, lineHeight: 1.5 }}>
          {visited.size === 0
            ? "Where did your story begin? Click any country to start."
            : `${visited.size} of 195 countries · ${conts.size} continent${conts.size !== 1 ? 's' : ''} · ${((visited.size / 195) * 100).toFixed(1)}% of the world`
          }
        </p>
      </div>

      {/* ─── Stats Bar ─── */}
      <div style={{ display: 'flex', gap: 0, margin: '20px 16px 0', background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, boxShadow: `0 2px 12px ${C.shadow}`, overflow: 'hidden', flexWrap: 'wrap', width: 'calc(100% - 32px)', maxWidth: 700 }}>
        {[
          { value: visited.size, label: 'of 195 countries' },
          { value: conts.size, label: 'of 7 continents' },
          { value: visited.size > 0 ? ((visited.size / 195) * 100).toFixed(1) + '%' : '0%', label: 'of the world' },
          { value: xp, label: `XP · ${title}` },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2.5vw, 24px)', borderRight: i < 3 ? `1px solid ${C.borderLight}` : 'none', minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: C.accent, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', color: C.textMuted, fontWeight: 600, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── Tier Badge ─── */}
      {visited.size > 0 && (
        <div style={{ margin: '12px 16px 0', padding: '14px 20px', background: tier.colorBg, borderRadius: 14, border: `1px solid ${tier.colorSolid}25`, display: 'flex', alignItems: 'center', gap: 14, maxWidth: 700, width: 'calc(100% - 32px)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tier.colorSolid}15`, border: `2px solid ${tier.colorSolid}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{tier.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: tier.colorSolid }}>{tier.name} Passport</span>
              {tier.next && <span style={{ fontSize: 11, color: C.textMuted }}>{tier.next - visited.size} more to {getTier(tier.next).name}</span>}
            </div>
            {tier.next ? (
              <div style={{ height: 6, borderRadius: 3, background: `${tier.colorSolid}15`, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: tier.colorSolid, width: `${((visited.size - tier.threshold) / (tier.next - tier.threshold)) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
            ) : (
              <div style={{ fontSize: 11, color: tier.colorSolid, fontWeight: 600 }}>Maximum tier achieved! You're a true explorer.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab Toggle + Search ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 16px 0', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ display: 'flex', background: C.bgDeep, borderRadius: 12, padding: 3, gap: 2 }}>
          {['map', 'passport', 'collections'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '9px clamp(14px, 3vw, 24px)', borderRadius: 10, border: 'none',
              background: activeTab === tab ? C.card : 'transparent', color: activeTab === tab ? C.text : C.textSoft,
              fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: activeTab === tab ? `0 1px 4px ${C.shadow}` : 'none', transition: 'all 0.2s ease',
            }}>
              {tab === 'map' ? '🗺️ World Map' : tab === 'passport' ? '📔 Passport' : '🏆 Collections'}
            </button>
          ))}
        </div>

        {activeTab === 'map' && (
          <div style={{ position: 'relative' }}>
            <div onClick={() => setShowSearch(s => !s)} style={{ padding: '9px 16px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSoft, fontWeight: 500 }}>
              🔍 Search countries
            </div>
            {showSearch && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: C.card, borderRadius: 16, padding: 12, width: 300, border: `1px solid ${C.border}`, boxShadow: `0 12px 40px ${C.shadowDeep}` }}>
                <input autoFocus placeholder="Type a country name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgDeep, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 8, maxHeight: 240, overflowY: 'auto' }}>
                    {searchResults.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.bgDeep} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div onClick={() => focusCountry(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 20 }}>{r.sticker?.icon}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: C.textMuted }}>{r.continent} {visited.has(r.id) ? '· ✓ Visited' : ''}</div>
                          </div>
                        </div>
                        {!visited.has(r.id) ? (
                          <div onClick={() => { handleCountryClick(r.id); setShowSearch(false); setSearchQuery('') }}
                            style={{ padding: '4px 10px', borderRadius: 8, background: `${C.accent}15`, color: C.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', border: `1px solid ${C.accent}30` }}>
                            + Add
                          </div>
                        ) : (
                          <div onClick={() => {
                            const ex = memories[r.id] || {}
                            setMemoryDraft({ note: ex.note || '', region: ex.region || '', city: ex.city || '', customLocation: ex.customLocation || '', month: ex.month || '', year: ex.year || '', photos: ex.photos || [] })
                            setShowMemoryModal(r.id); setShowSearch(false); setSearchQuery('')
                          }} style={{ padding: '4px 10px', borderRadius: 8, background: `${C.accent}10`, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            ✏️ Edit
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════ MAP TAB ═══════════ */}
      {activeTab === 'map' && (
        <div style={{ width: '100%', maxWidth: 960, margin: '16px auto 0', position: 'relative', padding: '0 8px' }}>
          <svg ref={mapRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ width: '100%', height: 'auto', maxHeight: '70vh', cursor: transform.k > 1 ? 'grab' : 'crosshair', borderRadius: 16, background: C.ocean, boxShadow: `0 4px 20px ${C.shadow}` }}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={C.ocean} />
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
              {worldData && worldData.features.map(f => {
                const d = pathGenerator(f)
                if (!d) return null
                const id = f.id, isV = visited.has(id), isH = hovered === id
                return (
                  <path key={id} d={d} fill={getCountryColor(id)} stroke={isV ? '#fff' : C.border} strokeWidth={isV ? 1 : 0.3}
                    style={{ cursor: 'pointer', transition: 'fill 0.25s ease', filter: isH ? 'brightness(1.05)' : 'none' }}
                    onMouseEnter={() => setHovered(id)} onMouseLeave={() => setHovered(null)} onClick={() => handleCountryClick(id)} />
                )
              })}
            </g>
          </svg>
          {/* Zoom controls */}
          <div style={{ position: 'absolute', bottom: 16, right: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: '+', fn: () => setTransform(p => ({ ...p, k: Math.min(8, p.k * 1.3) })) },
              { label: '−', fn: () => setTransform(p => ({ ...p, k: Math.max(1, p.k * 0.77) })) },
              ...(transform.k > 1 ? [{ label: '↺', fn: resetZoom }] : []),
            ].map((b, i) => (
              <button key={i} onClick={b.fn} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: `${C.card}ee`, color: C.text, fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', boxShadow: `0 2px 8px ${C.shadow}` }}>{b.label}</button>
            ))}
          </div>
          {/* Hover tooltip */}
          {hovered && COUNTRY_DATA[hovered] && (
            <div style={{ position: 'absolute', left: mousePos.x + 16, top: mousePos.y - 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: `0 4px 16px ${C.shadowDeep}`, pointerEvents: 'none', zIndex: 15 }}>
              <span style={{ fontSize: 20 }}>{COUNTRY_DATA[hovered].sticker?.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{COUNTRY_DATA[hovered].name}</div>
                <div style={{ fontSize: 11, color: C.textSoft }}>
                  {visited.has(hovered) ? (() => {
                    const score = getMemoryScore(memories[hovered])
                    return `✓ Visited · ${"★".repeat(score.stars)}${"☆".repeat(5 - score.stars)} ${score.label}`
                  })() : 'Click to mark as visited'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ PASSPORT TAB ═══════════ */}
      {activeTab === 'passport' && (
        <div style={{ width: '100%', maxWidth: 700, padding: '20px 16px' }}>
          {visitedArr.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Your passport is empty</h3>
              <p style={{ color: C.textSoft, fontSize: 14, marginTop: 8 }}>Click on countries in the map to start filling your passport.</p>
            </div>
          ) : (
            <div>
              {/* Passport page navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button onClick={() => setPassportPage(p => Math.max(0, p - 1))} disabled={passportPage === 0}
                  style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: passportPage === 0 ? C.textMuted : C.textSoft, fontWeight: 600, fontSize: 12, cursor: passportPage === 0 ? 'default' : 'pointer', opacity: passportPage === 0 ? 0.5 : 1 }}>← Prev</button>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textSoft }}>Page {passportPage + 1} of {visitedArr.length}</span>
                <button onClick={() => setPassportPage(p => Math.min(visitedArr.length - 1, p + 1))} disabled={passportPage >= visitedArr.length - 1}
                  style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: passportPage >= visitedArr.length - 1 ? C.textMuted : C.textSoft, fontWeight: 600, fontSize: 12, cursor: passportPage >= visitedArr.length - 1 ? 'default' : 'pointer', opacity: passportPage >= visitedArr.length - 1 ? 0.5 : 1 }}>Next →</button>
              </div>

              {/* Current passport page */}
              {(() => {
                const c = visitedArr[passportPage]
                if (!c) return null
                const color = CONTINENT_COLORS[c.continent] || C.accent
                const sLevel = getStickerLevel(c.memory)
                const sStyle = stickerStyles[sLevel](color)
                const score = getMemoryScore(c.memory)

                return (
                  <div style={{ background: C.card, borderRadius: 24, overflow: 'hidden', boxShadow: `0 8px 32px ${C.shadow}`, border: `1px solid ${C.border}`, animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    {/* Page header */}
                    <div style={{ background: `${color}08`, borderBottom: `1px solid ${color}15`, padding: 'clamp(16px, 3vw, 28px)', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0, ...sStyle }}>{c.sticker?.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 'clamp(18px, 3vw, 22px)', color: C.text }}>{c.name}</div>
                        <div style={{ fontSize: 13, color, fontWeight: 600 }}>{c.sticker?.title}</div>
                        <div style={{ fontSize: 12, color: C.textSoft, fontStyle: 'italic' }}>{c.sticker?.desc}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <span style={{ fontSize: 13, letterSpacing: 1 }}>{"★".repeat(score.stars)}{"☆".repeat(5 - score.stars)}</span>
                          <span style={{ fontSize: 11, color: C.textMuted }}>{score.label}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: `${color}12`, color, fontWeight: 700 }}>Lv.{sLevel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Page body */}
                    <div style={{ padding: 'clamp(16px, 3vw, 28px) clamp(16px, 3vw, 32px) clamp(20px, 3vw, 32px)' }}>
                      {c.memory?.note ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 10 }}>YOUR MEMORY</div>
                          <div style={{ fontSize: 16, color: C.text, lineHeight: 1.7, fontStyle: 'italic', padding: '16px 20px', background: C.bgDeep, borderRadius: 14, borderLeft: `3px solid ${color}40` }}>
                            &ldquo;{c.memory.note}&rdquo;
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 10 }}>No memory added yet</div>
                          <button onClick={() => { setMemoryDraft({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] }); setShowMemoryModal(c.id) }}
                            style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Write a memory</button>
                        </div>
                      )}

                      {/* Location & Date info */}
                      {(c.memory?.location || c.memory?.date) && (
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                          {c.memory?.location && <div style={{ fontSize: 12, color: C.textSoft }}>📍 {c.memory.location}</div>}
                          {c.memory?.date && <div style={{ fontSize: 12, color: C.textSoft }}>📅 {c.memory.date}</div>}
                        </div>
                      )}

                      {/* Photo Gallery */}
                      {c.memory?.photos && c.memory.photos.length > 0 ? (
                        <div style={{ marginTop: 20 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', marginBottom: 10 }}>YOUR PHOTOS ({c.memory.photos.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: c.memory.photos.length === 1 ? '1fr' : c.memory.photos.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                            {c.memory.photos.map((photo, idx) => (
                              <div key={idx} onClick={() => setLightboxPhoto(photo)}
                                style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', borderRadius: 12, cursor: 'pointer', boxShadow: `0 2px 8px ${C.shadow}` }}>
                                <img src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s ease' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: 20, border: `2px dashed ${C.border}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center', color: C.textMuted, fontSize: 13, background: `${C.bgDeep}80`, cursor: 'pointer' }}
                          onClick={() => setShowMemoryModal(c.id)}>
                          📷 Add photos from {c.name}
                          <div style={{ fontSize: 11, marginTop: 4 }}>Click to upload your photos</div>
                        </div>
                      )}

                      {/* Edit & Delete */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button onClick={() => {
                          const ex = memories[c.id] || {}
                          setMemoryDraft({ note: ex.note || '', region: ex.region || '', city: ex.city || '', customLocation: ex.customLocation || '', month: ex.month || '', year: ex.year || '', photos: ex.photos || [] })
                          setShowMemoryModal(c.id)
                        }} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: `1px solid ${C.accent}`, background: 'transparent', color: C.accent, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          ✏️ Edit Memory
                        </button>
                        <button onClick={() => {
                          if (window.confirm(`Remove ${c.name} from your passport?`)) {
                            setMemories(prev => { const n = { ...prev }; delete n[c.id]; return n })
                            setVisited(prev => { const n = new Set(prev); n.delete(c.id); return n })
                            setPassportPage(p => Math.max(0, p - 1))
                            if (session && passportId) {
                              supabase.from('memories').delete().eq('passport_id', passportId).eq('country_code', c.id)
                              supabase.from('visited_countries').delete().eq('passport_id', passportId).eq('country_code', c.id)
                            }
                          }
                        }} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #e05555', background: 'transparent', color: '#e05555', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                          🗑️ Delete
                        </button>
                      </div>

                      {/* Discovery fact */}
                      <div style={{ marginTop: 20, padding: '14px 18px', background: `${color}06`, borderRadius: 12, border: `1px solid ${color}12` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 4 }}>DID YOU KNOW?</div>
                        <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>{c.discover}</div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Page dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                {visitedArr.map((c, i) => (
                  <div key={c.id} onClick={() => setPassportPage(i)} style={{
                    width: passportPage === i ? 28 : 8, height: 8, borderRadius: 4,
                    background: passportPage === i ? C.accent : C.border, cursor: 'pointer', transition: 'all 0.2s ease',
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ COLLECTIONS TAB ═══════════ */}
      {activeTab === 'collections' && (
        <div style={{ width: '100%', maxWidth: 700, padding: '20px 16px' }}>
          {/* Tier Overview Card */}
          <div style={{ background: `linear-gradient(135deg, ${tier.colorBg}, ${C.card})`, borderRadius: 20, padding: 'clamp(20px, 3vw, 28px)', marginBottom: 20, border: `1px solid ${tier.colorSolid}20`, boxShadow: `0 4px 20px ${C.shadow}`, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{tier.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: tier.colorSolid }}>{tier.name} Passport</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4, marginBottom: 16 }}>{visited.size} countries visited · {xp} XP</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {[
                { name: "Starter", icon: "🗺️", min: 0, solid: "#999" },
                { name: "Bronze", icon: "🥉", min: 5, solid: "#B87333" },
                { name: "Silver", icon: "🥈", min: 15, solid: "#8A95A5" },
                { name: "Gold", icon: "🥇", min: 30, solid: "#D4A520" },
                { name: "Platinum", icon: "⚜️", min: 50, solid: "#9B7FC4" },
                { name: "Diamond", icon: "💎", min: 100, solid: "#7DD3E8" },
              ].map((t, i) => {
                const isActive = visited.size >= t.min
                const isCurrent = tier.name === t.name
                return (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: isCurrent ? `${t.solid}20` : isActive ? `${t.solid}08` : C.bgDeep, border: isCurrent ? `2px solid ${t.solid}` : `1px solid ${isActive ? t.solid + '30' : C.border}`, opacity: isActive ? 1 : 0.4, textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 18 }}>{t.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? t.solid : C.textMuted, marginTop: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: C.textMuted }}>{t.min}+</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Regional Collections */}
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>🌍 Regional Collections</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {collections.map(col => (
              <div key={col.id} style={{ background: C.card, borderRadius: 16, padding: '18px 20px', border: col.completed ? `2px solid ${C.accent}` : `1px solid ${C.border}`, boxShadow: col.completed ? `0 4px 16px ${C.accent}15` : `0 2px 8px ${C.shadow}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: col.completed ? `${C.accent}12` : C.bgDeep, border: col.completed ? `2px solid ${C.accent}30` : `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {col.completed ? '✅' : col.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{col.name}</span>
                      {col.completed && <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: `${C.accent}12`, padding: '2px 8px', borderRadius: 6 }}>COMPLETE</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>{col.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.bgDeep, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: col.completed ? C.accent : `${C.accent}80`, width: `${(col.progress / col.target) * 100}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: col.completed ? C.accent : C.textMuted, whiteSpace: 'nowrap' }}>{col.progress}/{col.target}</span>
                    </div>
                  </div>
                </div>
                {col.visitedList.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
                    {col.visitedList.slice(0, 12).map(([id, c]) => (
                      <div key={id} title={c.name} style={{ width: 32, height: 32, borderRadius: 8, background: `${C.cont[c.continent]}10`, border: `1px solid ${C.cont[c.continent]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{c.sticker?.icon}</div>
                    ))}
                    {col.visitedList.length > 12 && <div style={{ width: 32, height: 32, borderRadius: 8, background: C.bgDeep, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>+{col.visitedList.length - 12}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Memory Quality Overview */}
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 28, marginBottom: 14 }}>⭐ Memory Quality</div>
          <div style={{ background: C.card, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, boxShadow: `0 2px 8px ${C.shadow}` }}>
            {visitedArr.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: C.textSoft, fontSize: 13 }}>Visit countries and add memories to track quality here</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Complete', count: visitedArr.filter(c => getMemoryScore(c.memory).stars === 5).length, color: '#D4A520' },
                    { label: 'Rich', count: visitedArr.filter(c => getMemoryScore(c.memory).stars === 4).length, color: C.accent },
                    { label: 'Detailed', count: visitedArr.filter(c => getMemoryScore(c.memory).stars === 3).length, color: '#6B7FBF' },
                    { label: 'Basic', count: visitedArr.filter(c => getMemoryScore(c.memory).stars <= 2).length, color: C.textMuted },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: '1 1 60px', textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: `${s.color}08` }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.count}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: s.color }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {visitedArr.map(c => {
                    const score = getMemoryScore(c.memory)
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: score.stars >= 5 ? `${C.accent}06` : 'transparent' }}>
                        <span style={{ fontSize: 18 }}>{c.sticker?.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{c.name}</span>
                        <span style={{ fontSize: 12, color: C.textMuted }}>{score.label}</span>
                        <span style={{ fontSize: 13, letterSpacing: 1 }}>{"★".repeat(score.stars)}{"☆".repeat(5 - score.stars)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Bottom Actions ─── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '20px 16px 40px' }}>
        {visited.size >= 1 && (
          <button onClick={() => setShowShareCard(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 20px rgba(91,140,90,0.25)' }}>
            ✨ Share Your Journey
          </button>
        )}
        {visited.size >= 3 && !session && (
          <button onClick={() => setShowAuthModal(true)} style={{ padding: '14px 28px', borderRadius: 14, border: `2px solid ${C.accentWarm}`, background: 'transparent', color: C.accentWarm, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Keep your map forever — Create Account
          </button>
        )}
      </div>

      {/* ─── Toast ─── */}
      {showToast && unlockedC && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: C.card, border: `1px solid ${C.cont[unlockedC.continent]}35`, borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 14, zIndex: 100, animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: `0 12px 40px ${C.shadowDeep}` }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C.cont[unlockedC.continent]}12`, border: `2px solid ${C.cont[unlockedC.continent]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{unlockedC.sticker?.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{unlockedC.sticker?.title}</div>
            <div style={{ fontSize: 12, color: C.textSoft }}>{unlockedC.name} — {unlockedC.sticker?.desc}</div>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, marginTop: 2 }}>+10 XP earned · Add details to evolve your sticker!</div>
          </div>
        </div>
      )}

      {/* ─── Memory Modal (Journal-Style) ─── */}
      {showMemoryModal && COUNTRY_DATA[showMemoryModal] && (() => {
        const mc = COUNTRY_DATA[showMemoryModal]
        const color = C.cont[mc.continent]
        const regionData = REGION_DATA[showMemoryModal]
        const regions = regionData?.regions || []
        const selectedRegion = regions.find(r => r.name === memoryDraft.region)
        const cities = selectedRegion?.cities || []
        const selectStyle = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgDeep, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box', appearance: 'none', WebkitAppearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%237B8D9E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', cursor: 'pointer' }
        const labelStyle = { fontSize: 11, fontWeight: 700, color: C.textMuted, display: 'block', marginBottom: 6, letterSpacing: '0.06em' }

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,74,92,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => saveMemory(showMemoryModal)}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, width: 460, maxWidth: '92vw', overflow: 'hidden', boxShadow: '0 24px 80px rgba(58,74,92,0.18)', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ background: `${color}08`, borderBottom: `1px solid ${color}15`, padding: '24px 28px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: `${color}12`, border: `2px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, flexShrink: 0 }}>{mc.sticker?.icon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>{mc.name}</div>
                  <div style={{ fontSize: 13, color, fontWeight: 600 }}>{mc.sticker?.title}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, fontStyle: 'italic' }}>{mc.sticker?.desc}</div>
                </div>
              </div>

              <div style={{ padding: '24px 28px 28px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 20 }}>📖 Your Travel Page</div>

                {/* WHERE */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>WHERE DID YOU GO? (+5 XP)</label>
                  {regions.length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <select value={memoryDraft.region} onChange={e => setMemoryDraft(d => ({ ...d, region: e.target.value, city: '', customLocation: '' }))} style={{ ...selectStyle, flex: '1 1 140px' }}>
                        <option value="">Select {mc.name === 'United States' ? 'state' : 'region'}...</option>
                        {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                      </select>
                      {memoryDraft.region && memoryDraft.region !== '__manual' && cities.length > 0 && (
                        <select value={memoryDraft.city} onChange={e => setMemoryDraft(d => ({ ...d, city: e.target.value, customLocation: '' }))} style={{ ...selectStyle, flex: '1 1 140px' }}>
                          <option value="">Select city...</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                          <option value="__other">Other...</option>
                        </select>
                      )}
                    </div>
                  ) : (
                    <input type="text" placeholder={`e.g., Cusco, Lima, Arequipa...`} value={memoryDraft.customLocation} onChange={e => setMemoryDraft(d => ({ ...d, customLocation: e.target.value }))} style={{ ...selectStyle, backgroundImage: 'none' }} />
                  )}
                  {(memoryDraft.city === '__other' || (regions.length > 0 && memoryDraft.region && memoryDraft.region !== '__manual' && !cities.length)) && (
                    <input type="text" placeholder="Type your city..." value={memoryDraft.customLocation} onChange={e => setMemoryDraft(d => ({ ...d, customLocation: e.target.value }))} style={{ ...selectStyle, backgroundImage: 'none', marginTop: 8 }} />
                  )}
                  {regions.length > 0 && memoryDraft.region !== '__manual' && (
                    <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted }}>
                      Can't find your location? <span style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }} onClick={() => setMemoryDraft(d => ({ ...d, region: '__manual', city: '' }))}>Type it manually</span>
                    </div>
                  )}
                  {memoryDraft.region === '__manual' && (
                    <input type="text" placeholder="e.g., Napa Valley, Route 66..." value={memoryDraft.customLocation} onChange={e => setMemoryDraft(d => ({ ...d, customLocation: e.target.value }))} style={{ ...selectStyle, backgroundImage: 'none', marginTop: 8 }} />
                  )}
                </div>

                {/* WHEN */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>WHEN DID YOU VISIT? (+5 XP)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={memoryDraft.month} onChange={e => setMemoryDraft(d => ({ ...d, month: e.target.value }))} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Month...</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={memoryDraft.year} onChange={e => setMemoryDraft(d => ({ ...d, year: e.target.value }))} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">Year...</option>
                      {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* MEMORY */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>YOUR MEMORY (+15 XP)</label>
                  <textarea placeholder="That street food stall in the rain... / The view from the mountain top... / Getting lost and finding something better..."
                    value={memoryDraft.note} onChange={e => setMemoryDraft(d => ({ ...d, note: e.target.value }))} rows={3}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bgDeep, fontSize: 14, color: C.text, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }} />
                </div>

                {/* PHOTOS */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>PHOTOS (+20 XP)</label>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || [])
                      const cur = memoryDraft.photos || []
                      if (cur.length + files.length > 10) { alert('Maximum 10 photos per country'); return }
                      const newPhotos = []
                      for (const file of files) { newPhotos.push(await compressImage(file)) }
                      setMemoryDraft(d => ({ ...d, photos: [...(d.photos || []), ...newPhotos] }))
                    }} />
                  <div onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = `${C.accent}08` }}
                    onDragLeave={e => { e.currentTarget.style.background = C.bgDeep }}
                    onDrop={async (e) => {
                      e.preventDefault(); e.currentTarget.style.background = C.bgDeep
                      const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
                      const cur = memoryDraft.photos || []
                      if (cur.length + files.length > 10) { alert('Maximum 10 photos per country'); return }
                      const newPhotos = []
                      for (const file of files) { newPhotos.push(await compressImage(file)) }
                      setMemoryDraft(d => ({ ...d, photos: [...(d.photos || []), ...newPhotos] }))
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: `2px dashed ${C.border}`, borderRadius: 12, padding: '20px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13, background: C.bgDeep, cursor: 'pointer', transition: 'background 0.2s' }}>
                    📷 Drag & drop or click to upload
                    <div style={{ fontSize: 11, marginTop: 4 }}>Up to 10 photos ({memoryDraft.photos?.length || 0}/10)</div>
                  </div>
                  {memoryDraft.photos && memoryDraft.photos.length > 0 && (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 8 }}>
                      {memoryDraft.photos.map((photo, idx) => (
                        <div key={idx} style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', borderRadius: 10, background: C.bgDeep, border: `1px solid ${C.border}` }}>
                          <img src={photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => setMemoryDraft(d => ({ ...d, photos: d.photos.filter((_, i) => i !== idx) }))}
                            style={{ position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, background: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => saveMemory(showMemoryModal)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(91,140,90,0.25)' }}>Save to Passport</button>
                  <button onClick={() => { setShowMemoryModal(null); setMemoryDraft({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] }) }}
                    style={{ padding: '14px 20px', borderRadius: 14, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSoft, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Skip</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── Share Card Modal ─── */}
      {showShareCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,74,92,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowShareCard(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgDeep})`, borderRadius: 28, padding: '40px 44px', width: 420, maxWidth: '92vw', textAlign: 'center', boxShadow: '0 24px 80px rgba(58,74,92,0.2)', animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              <svg width={20} height={24} viewBox="0 0 100 120" fill="none" stroke={C.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10 L50 75 L85 10" /><ellipse cx="50" cy="95" rx="20" ry="8" />
              </svg>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 14, letterSpacing: '0.1em' }}>VENTURE</span>
            </div>
            <div style={{ fontSize: 60, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{visited.size}</div>
            <div style={{ fontSize: 15, color: C.textSoft, marginBottom: 8 }}>of 195 countries explored</div>
            <div style={{ fontSize: 44, marginBottom: 6 }}>{conts.size >= 6 ? '🌍' : conts.size >= 4 ? '✈️' : conts.size >= 2 ? '🧳' : '🗺️'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: C.textSoft, marginBottom: 24 }}>
              {conts.size} continent{conts.size !== 1 ? 's' : ''} · {xp} XP · {((visited.size / 195) * 100).toFixed(1)}% of the world
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28, flexWrap: 'wrap' }}>
              {visitedArr.slice(0, 10).map(c => (
                <div key={c.id} style={{ width: 42, height: 42, borderRadius: 11, background: `${C.cont[c.continent]}10`, border: `1.5px solid ${C.cont[c.continent]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{c.sticker?.icon}</div>
              ))}
              {visitedArr.length > 10 && <div style={{ width: 42, height: 42, borderRadius: 11, background: C.bgDeep, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.textSoft }}>+{visitedArr.length - 10}</div>}
            </div>
            <div onClick={() => setShowShareCard(false)} style={{ padding: '14px 28px', borderRadius: 14, background: C.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-block' }}>
              Screenshot & Share ✨
            </div>
          </div>
        </div>
      )}

      {/* ─── Photo Lightbox ─── */}
      {lightboxPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58,74,92,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }} onClick={() => setLightboxPhoto(null)}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightboxPhoto} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, boxShadow: '0 20px 60px rgba(58,74,92,0.4)' }} />
            <button onClick={() => setLightboxPhoto(null)} style={{ position: 'absolute', top: -40, right: 0, width: 40, height: 40, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
