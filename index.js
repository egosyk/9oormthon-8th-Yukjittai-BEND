const express = require("express");
const bodyParser = require("body-parser");
const OpenAI  = require('openai');
const cors = require('cors');
const axios = require('axios');

require("dotenv").config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

const a = 'sk-5F9jdIcpsuGKX81Ev3M8T3'
const b = 'BlbkFJgB7UJPR5idvnhUX3TVLF'
const c = '106cf0a2028dfd5'
const d = '2110999d46a76aa66'
const apiKey = a + b;
const kakaoApiKey = c + d;

const openai = new OpenAI({
  apiKey,
});

app.get("/api/ping", (req, res) => {
    res.send("테스트")
})

// GPT API
app.post("/api/message", (req, res) => {
    const keyword = req.body.keyword
    const condition1 = req.body.condition1
    const condition2 = req.body.condition2
    const message = `당신은 제주도 관광업체의 전문가입니다. 당신은 관광 활동의 추천을 담당하고 있습니다.
    나는 지금 ${keyword} 나는 ${condition1} 활동과 ${condition2} 활동이 하고 싶습니다. 아래의 조건 사항을 지켜 추천해주십시오.
    1. 정확한 활동명으로 추천해주세요
    2. 제안된 활동명은 1어절 단위의 1개의 단어로 표현해주십시오.
    3. 활동명은 2개만 추천해주십시오. 그 외의 추천은 필요 없습니다.
    `
    

    const openFun = async() => {
        try{

            const chatCompletion = await openai.chat.completions.create({
                model: "gpt-4-0314", //gpt-3.5-turbo
                messages: [{"role": "user", "content": message,}],
                max_tokens:1000
            });


            const responseArray = chatCompletion.choices[0].message.content
            .split("\n")
            .map(line => line.replace(/^\d+\.\s*/, '').trim()) // Remove numbers and trim
            .filter(line => line);
        
          res.status(200).send(responseArray)

        }catch(error){
            console.log(error);
            res.status(500).send(error)
        }

    }   
    openFun();   
});

// 카카오 다중목적지 길찾기 API 라우트
app.post('/api/kakao/directions', async (req, res) => {
  console.log("req.body : ", req.body);
    try {
      const kakaoResponse = await axios.post('https://apis-navi.kakaomobility.com/v1/destinations/directions', req.body, {
        headers: {
          Authorization: KakaoAK ${kakaoApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      res.json(kakaoResponse.data);
    } catch (error) {
      console.error('Error calling Kakao Directions API:', error);
      res.status(500).send('Error processing your request');
    }
});

// Place 관련 서비스 로직
const sortAndFilterPlaces = (places) => {
    // 반경으로 필터링 예시
    const filteredByRadius = places.filter(place => place.radius <= someRadiusValue);
  
    // 리뷰 수로 정렬
    const sortedByReviews = filteredByRadius.sort((a, b) => b.reviewCount - a.reviewCount);
  
    // 가나다순으로 정렬
    const sortedAlphabetically = sortedByReviews.sort((a, b) => a.name.localeCompare(b.name));
  
    return sortedAlphabetically;
  };
  
  // Place 라우트
  app.get('/api/places', async (req, res) => {
    try {
      const { places } = req.query;
      const sortedPlace = sortAndFilterPlaces(places);
      res.status(200).json(sortedPlace);
    } catch (error) {
      console.error('Error in place processing:', error);
      res.status(500).send('Error processing your request');
    }
});

app.post('/api/search-places', async (req, res) => {
    const { standard, radius, type, places } = req.body;
    // console.log('places: ', places);
    // console.log('standard: ', standard);
    try {
        let filteredPlaces = filterByRadius(places, standard, radius);
        filteredPlaces = filterByType(filteredPlaces, type);
        console.log("filteredPlaces: ", filteredPlaces);
        res.send(filteredPlaces.slice(0, 5));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

function filterByRadius(places, standard, radius) {
    const distanceAddedPlaces = places.map(place =>{ 
        const distance = getDistanceFromLatLonInKm(
            standard.y, standard.x, // 기준 좌표 (위도, 경도)
            parseFloat(place.y), parseFloat(place.x) // 장소의 좌표 (위도, 경도)
          );
        console.log('distance: ', distance);
        return({
      ...place,
      distance
    })});

    console.log('distanceAddedPlaces: ', distanceAddedPlaces);
  
    if (radius === "가까운 순으로") {
      console.log('!@#!@$@!$');
      // "가까운 순"으로 정렬
      return distanceAddedPlaces.sort((a, b) => a.distance - b.distance);
    } else if (radius === "50km") {
      // 500m 이내의 장소 필터링
      return distanceAddedPlaces.filter(place => place.distance <= 50);
    } else if (radius === "10km") {
      // 1km 이내의 장소 필터링
      return distanceAddedPlaces.filter(place => place.distance <= 10);
    }
    return [];
}
  
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구의 반지름(km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 거리(km)
}
  
function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function filterByType(places, type) {
    const indoorTypes = ["아쿠아리움", "박물관", "식물원", "전망대", "전시관", "인라인스케이트", "만화카페", 
  '매표소', '관광지', '낚시', '여행'];
    const themeTypes = ["농장", "동굴", "테마파크", "탑", "성곽", "유원지", "문화유적", "숲"];
    console.log('places: ', places);
    return places.reduce((acc, place) => {
      const category = place.category_name;
      console.log('categoryName: ', category);
      // console.log('category: ', {category}, {type});
      if (type === "실내 관광지") {
        console.log('indoorTypes.some(indoorType =>  category.includes(indoorType)): ', indoorTypes.some(indoorType =>  category.includes(indoorType)));
        if (indoorTypes.some(indoorType =>  category.includes(indoorType))) {
          acc.push(place);
        }
      } else if (type === "테마 관광지") {
        if (themeTypes.some(themeType => category.includes(themeType))) {
          acc.push(place);
        }
      }

      return acc;

    }, []);
}

const port = 8000;

app.listen(port, () => {
    console.log(`${port}`);
})