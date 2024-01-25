# GreenMileage

## 프로젝트 소개

환경에 관련된 활동들을 하고, 포인트를 적립하는 커뮤니티

## 개발환경

- React native for web
- Nodejs
- MySQL, MongoDB

## 팀원

박은비 - 카이스트 전산학부

한채연 - 숙명여대 IT공학과

## 구현기능

### 로그인 및 회원가입

<img src="https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/8eed0839-57f1-4ce1-a720-cf0b73c26835" width="40%" height="30%"/>
<img src="https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/10fc25cf-c155-4351-b4a6-ce4d8748269e" width="40%" height="30%"/>

- 카카오, 네이버, 구글 로그인 구현
    - 로그인 버튼 클릭시, 등록해둔 주소로 리다이렉션되고, 권한 서버에게 Authorization code를 전달받고, 이 Authorization Code로 Access Token을 받아 사용자의 정보를 받아옴
- 자체 로그인, 회원가입
    - email과 password를 통해 회원가입을 하며, password는 암호화시켜 데이터베이스에 저장
    - 회원가입시 이메일 중복 검사진행
- 정상적으로 로그인이 되었다면, jwt토큰을 생성해서 반환

### Home

![Untitled (2)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/5d1b1602-c10e-4fe9-a0c4-2c5e05223590)

- 크롤링한 캠페인 정보를 메인화면에 띄워줌
- 3초가 지나면 그 다음 화면으로 넘어가고, 하단의 dot을 클릭하여 이동가능

### Map

- google map api를 통해 지도를 띄우고 현재 위치를 받아와 현재 위치를 표시하도록 함

![Untitled (3)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/66bf4bbb-f3d3-441a-b526-3bf458ef3874)

- 공공데이터 포털에서 전기차 충전소 관련 api와 타슈 관련 api를 발급받아서 json 형태의 정보로 반환받고 해당 정보의 위도와 경도를 토대로 지도에 표시함

![Untitled (4)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/84ffd166-aa4d-465a-9e1a-6cdad338d7e7)

### Campaign

![Untitled (4)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/9c5d26d4-0675-4e2f-a3d5-6baf52f7016d)

- Nodejs의 cheerio 모듈을 사용하여 캠페인 정보를 크롤링을 통해 정보 수집
    - 캠페인 : 이미지, 제목, 링크
    - 크롤링한 정보를 json 형태로 반환
- 각 캠페인마다 포인트를 할당하고 참여하기 버튼을 누르면 해당 캠페인의 포인트만큼 적립되고 버튼 내용이 참여중으로 바뀌도록 함. 또한 사용자와 캠페인 정보를 데이터베이스에 넘겨 캠페인에 참여중인 사람들의 정보를 저장할 수 있도록 함.

![Untitled (6)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/6158373b-80f5-44d7-939a-b25d3a8e7d62)

- 참여중인 사람 보기 버튼을 누르면 해당 캠페인에 참여중인 사용자 목록을 볼 수 있고 팔로우 버튼을 통해 팔로우 할 수 있음.

![Untitled (7)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/542517d9-addf-4295-9a61-6f9d5080bd75)

### Products

![Untitled (8)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/cbf11f2a-52d3-40e4-b0af-b110463d9fa0)

- 구매하기 버튼 클릭시 해당 포인트만큼 적립

### 마이페이지

- 마이페이지에서는 나의 프로필, 팔로워, 팔로잉, 내가 참여중인 캠페인 등의 정보를 가져올 수 있도록 함

![Untitled (9)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/e264cdff-f56f-4a84-8180-8e26747561b0)

- 팔로워와 팔로잉 유저 정보는 토글을 통해 선택적으로 확인할 수 있음.

![Untitled (10)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/54a91ceb-40ef-4bf2-b51c-f71ff61f91bf)

- 팔로워, 팔로잉 유저들 정보 아래에 있는 채팅하기 버튼을 누르면 해당 유저와 채팅할 수 있는 채팅창으로 넘어감.

![Untitled (11)](https://github.com/ChaeyeonHan/GreenMileage_Back/assets/71596178/04fbf858-82e7-450c-b9e0-e305fe81a2cc)

- [socket.io](http://socket.io) 라이브러리를 사용하여 사용자들간에 1:1, 1:N 채팅 구
- 메시지 전송시, 해당 채팅방에 들어와있는 사용자들에게 메시지 전송
- 채팅방에 입장하고, 나갈 때에도 메시지 전송
