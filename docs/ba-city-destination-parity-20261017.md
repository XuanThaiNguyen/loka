- **Mục tiêu:** Loka giúp khách tìm hiểu điểm đến Việt Nam; Phase 1 gồm Đà Nẵng, TP.HCM, Hà Nội, Nha Trang và Ninh Bình. BA + designer đề xuất; developer triển khai.
- **Đã xác minh dữ liệu:** API đang có 5 city và 42 destination thuộc phạm vi; gói mới có 37 destination EN/VI, còn 5 destination cũ tại Đà Nẵng chưa được bổ sung bản dịch/nguồn. Không đồng nhất “37 đã nhập” với “toàn catalog đã đủ”.
- **P0 đã báo và developer sửa trong phiên:** null visit-profile từng bị đổi thành404; BA đọc lại42điểm×VI/no-header đã nhận200+null. Còn tồn tại: 11 URL ảnh destination trả 403, 31 destination trống ảnh; ba city mới trống cover.
- **Khoảng cách nội dung:** web Đà Nẵng có 11 section/34 item; localized API thay bằng 6 section văn bản. Destination import chỉ có mô tả + tip, sections rỗng; app chưa có đường truyền/render editorial sections đầy đủ.
- **Thiết kế:** ưu tiên kiến thức, tìm kiếm và địa điểm; tinh giản khối hero/statistics, thống nhất màu/typography/cards, giữ nội dung sâu qua nhóm/expand. No-price toàn mobile; giữ Create New Trip và Low/Medium/Luxury. Không redesign admin.

# Loka — BA và thiết kế mobile, đối chiếu city/destination

17/10/2026. Đây là addendum hợp nhất cho `ba-travel-knowledge-handoff-20261017.md`, `ba-mobile-visual-qa-20261017.md` và `ba-phase1-no-pricing-20261017.md`. Yêu cầu mới cho phép BA đồng thời làm designer và đánh giá lại bố cục toàn mobile, gồm Home/Profile; thay thế giới hạn cũ “chỉ chỉnh màu/giữ nguyên layout”. Developer vẫn sở hữu implementation. Không sửa code, database, admin presentation hoặc deployment trong review này.

## 1. Bằng chứng hiện tại và phần đã hoàn thành

Stack: mobile Expo 57 / React Native 0.86 / React 19, Expo Router, HeroUI Native, TanStack Query, Reanimated, i18next; BE Bun/Hono/Drizzle, Neon/PostgreSQL, Redis/BullMQ, R2; web Vite/React Router và admin hiện có. Bản source đang sửa dở; HEAD mobile `8ed2e85`, backend `3ccfdca` chỉ là commit nền, không đại diện toàn working tree. Không stash/revert/commit thay đổi của developer.

Developer task đã xác minh: **Thiết kế lại trang cá nhân**, `01a14871-5dcd-7161-9d2a-82f5238d31e3`, host local, cwd `/Users/xuanthainguyen/Desktop/loka-pland`. Task đã được gửi các handoff trước; review này nối tiếp cùng task. `pland/docs/bilingual-catalog.md` và import report xác nhận đã nhập 84 bản published: 42 EN + 42 VI (5 city + 37 destination mỗi locale), thêm 3 city/31 destination và giữ ID cũ. BA đọc lại public API, không chạy importer.

Những phần đã có, không giao xây lại: Search All/Places/Cities/People, nối Home → Search, Home View all cities → Search scope cities, truy vấn theo locale/cache theo locale, lỗi catalog không còn thay bằng dữ liệu demo, CatalogImage fallback trung tính, ContentSources, màn city với sáu tab và xem đủ danh sách, destination Save/Map/Add to trip. Broader no-price chưa hoàn thành; chính tài liệu developer cũng ghi rõ giới hạn này.

### Phạm vi runtime thực sự đã kiểm tra

- Trên **máy người dùng**, qua Codex in-app browser đã đăng nhập: URL `http://localhost:5173/explore/cities/3f5d650f-ad92-4b78-8d11-ad7e8fcf7c1f` hiển thị Danang; đã đọc cây nội dung toàn trang, điều hướng Food/Staying connected, xem ảnh phần nội dung và cuối guide. Web My Khe `…/explore/destinations/bf341273-09bb-4ef0-90e7-5b57f69870ca`: đọc toàn nội dung và kiểm tra Planning your visit. Đây là web so sánh, không mẫu UI bắt buộc cho mobile.
- Simulator **iPhone 17 Pro, iOS 26.5**, app VI: Home → Search → Đà Nẵng, lần lượt chọn cả 6 tab, mở Read more ở thời tiết, View all 12 destination, mở Biển Mỹ Khê; đọc các nguồn và nội dung cuối màn qua accessibility. Đã xem ảnh thực của city list, tab guide và hero Mỹ Khê. Ảnh list cho thấy nhiều fallback và tên Sơn Trà bị rút gọn. Runtime Mỹ Khê có lỗi knowledge, tags tiếng Anh giữa UI VI, statistics chiếm nhiều diện tích.
- Source/API coverage: 5 city × EN/VI và base city; **42 destination × EN/VI**, danh sách city `hasMore=false` ở mỗi city, visit-profile và URL cover. Chi tiết từng ID tại `ba-evidence-20261017/destination-coverage.csv`; response public tại `catalog-parity-public-api.json`.
- Ảnh người dùng cung cấp đã materialize **vào Mac**, kiểm tra PNG 942×2048 và xem pixels: `ba-evidence-20261017/simulator_screenshot_749DCCF3-7DF2-4D1E-AA49-03AD59826754.png`, Library `libfile_f9ec892b2398819187bf316df9d56707`.
- **Bổ sung EN và màn phụ:** đã kiểm tra Profile/Saved, Settings đổi VI→EN→VI, Favorites, CreateTrip ba bước chưa submit, date sheet Cancel, MyTrip và một Trip detail; My Khe→Da Nang→show all12→back. Chi tiết kết quả tại mục8.1. Không save/unsave, tạo trip, publish hoặc sửa dữ liệu nghiệp vụ. Chỉ đổi locale tạm thời theo scope QA rồi xác minh khôi phục Tiếng Việt.
- **Chưa runtime certify:** Android (ADB không có thiết bị kết nối), chữ lớn, software keyboard overlap, bốn city khác và41destination khác, full Planner/Plan detail/Sign-in/Traveler, mutations, offline/slow network và performance. Không coi API toàncatalog hoặc accessibility tree là visual pass toàn bộ screen. Người dùng có thể thay đổi simulator; luôn đọc lại trạng thái trước thao tác.

## 2. Catalog coverage và lỗi dữ liệu

| City | Destination hiện có | Có VI và sources mới | Legacy còn thiếu | City sections localized / base |
|---|---:|---:|---:|---:|
| Đà Nẵng | 12 | 7 | 5 | 6 / 11 |
| TP.HCM | 8 | 8 | 0 | 6 / 0 |
| Hà Nội | 8 | 8 | 0 | 6 / 0 |
| Nha Trang | 6 | 6 | 0 | 6 / 0 |
| Ninh Bình | 8 | 8 | 0 | 6 / 0 |
| **Tổng** | **42** | **37** | **5** | **30 localized sections** |

Năm legacy cần giữ ID và bổ sung: `cho-con`, `linh-ung-pagoda-son-tra`, `sun-world-ba-na-hills`, `non-nuoc-beach`, `da-nang-downtown`. Linh Ứng cũng xuất hiện trong bài Sơn Trà mới: làm rõ entity riêng và bài tổng quan liên quan, không xóa/gộp ID ảnh hưởng trip/favorites. Hoi An còn xuất hiện ở Home/Search trong runtime; bảo tồn dữ liệu nhưng không đưa vào lựa chọn quảng bá Phase 1 năm city. Không mở rộng rollout sang Kyoto/demo cities.

### P0 đã sửa ở API — null knowledge không phải entity bị ẩn

`pland/src/http/catalog.ts:55` trả `{data:null}` khi destination tồn tại nhưng chưa có visit-profile. Bản trước khi sửa của `catalog-localization.ts:106` đổi bất kỳ `localized.data === null` thành `CONTENT_UNAVAILABLE` 404. App gửi locale tại `loka/src/lib/api/client.ts:61`; `visit-profile-card.tsx` coi đó là lỗi và cho Retry. Web không header có empty/unknown state đúng. Tái hiện Mỹ Khê: web “Practical visit knowledge has not been added yet”; app “Không thể tải thông tin. Vui lòng thử lại.”

Developer đã sửa guard chỉ chuyển404 khi payload.data ban đầu là entity và bị publication filtering loại. BA đã đọc lại cả42destination: VI và no-header đều200 + data:null; bằng chứng `visit-profile-contract-checks.json`. Developer báo11tests và126calls VI/EN/web đạt; BA không tự nhận đã chạy bộtest đó. Lần mở lại Mỹ Khê bằng EN trên iPhone17Pro đã tải Details/Before you go/Sources và không còn lỗi visit-profile/Retry. Regression đóng ở API và mẫu runtime EN này; không suy ra mọi destination/locale đã visual pass. Cần thống nhất UX unknown thay vì im lặng khiến người dùng nghĩ thông tin đã đầy đủ. QA còn phải bao gồm destination absent, draft, valid profile, expired profile và network failure. Không chữa bằng điền dữ liệu giả hoặc vô hiệu hóa publication filtering.

### P0 — ảnh có ba loại thiếu khác nhau

GET với URL thực tại thời điểm review: cover Đà Nẵng external **200 image/png**; cover Nha Trang `/api/city-photos/bdb55c1b-d71b-43aa-aab0-3c6f82363734.jpg` **200 image/jpeg**; TP.HCM/Hà Nội/Ninh Bình empty. Trong 42 destination: **11 Googleusercontent URLs GET403**, **31 empty**. Không gọi empty là broken URL. `image-url-checks.json` lưu thời gian, status/content-type; GET200 không chứng minh quyền ảnh, đúng chủ thể hoặc hoạt động trên thiết bị thật.

Đề xuất: admin chọn ảnh đã có quyền và lưu asset do hệ thống quản lý; metadata nguồn/quyền/alt/focal point; public URL không phụ thuộc localhost của máy khác. Wrapper mobile đã rewrite localhost city-photo sang apiBaseURL và có fallback; kiểm tra LAN/device/release API origin, MIME/decoding/cache. Không hotlink lại Google tạm thời hoặc tìm ảnh rồi mặc định có quyền. Trước khi có ảnh được duyệt, card vẫn hữu ích bằng tên/khu vực/điểm nổi bật, placeholder gọn; không dùng khối ảnh rỗng cao như có nội dung.

### P0 — nội dung chưa đủ dù đã import thành công

`pland/scripts/import-bilingual-catalog.ts:120` đặt destination `sections: []`; `five-city-bilingual.ts` chỉ rút gọn mỗi địa điểm thành mô tả và tip. Schema hỗ trợ sections nhưng API destination branch không project, mobile DestinationDTO/mapper/render không có sections. Vì vậy không khẳng định sections đầy đủ đã được lưu rồi chỉ bị UI giấu: **cả editorial population và đường truyền đều cần hoàn thiện**. Cả42destination trả200 + null visit-profile ở lần đọc cuối; chưa có practical profile nào để trình bày.

Dùng gói revised `content-staging-20261017/phase1-five-city-content.md` làm nguồn biên tập 37 điểm, đối chiếu từng bài, giữ kiến thức hữu ích như lý do đến, cách tiếp cận, chuẩn bị, quy tắc ứng xử, khả năng tiếp cận, thời tiết và gợi ý kết hợp; không chỉ dịch hai câu. Giữ unknown khi chưa có nguồn. Các giờ mở cửa bị bỏ do chưa xác minh không được khôi phục máy móc từ legacy. Bổ sung research cho 5 legacy theo cùng chuẩn. Nội dung UI và taxonomy phải VI/EN; source title có thể giữ tên chính thức.

### P0/P1 — dấu hiệu cần editorial review

Web legacy Đà Nẵng có item **Hellooooooooo** với ảnh AI System Design Cheat Sheet, và prose quảng bá Traveloka trong transport/CTA. Chúng không phù hợp kiến thức Loka; cần bỏ khỏi publication sau khi editor duyệt, giữ lịch sử. Không “restore parity” bằng copy nguyên legacy, đặc biệt claims an toàn/seasonal chưa có nguồn. Đề xuất giữ cấu trúc hữu ích, thay copy bằng phiên bản có nguồn; chưa xác minh số lượt ghé thăm/rating cũ, không nâng thành claim do Loka đo.

Mỹ Khê localized description cập nhật mới nhưng `lastCuratedAt` vẫn 8/9/2026; sources checkedOn 17/10/2026. Cần metadata đúng revision nội dung và tách source-reviewed/operationally-verified, không gắn ngày cũ cho bài mới hoặc gọi checkedOn là verified.

## 3. Ma trận parity city — nội dung nào phải còn truy cập được

| Web/admin legacy Đà Nẵng | Localized API/mobile hiện tại | Target và ưu tiên |
|---|---|---|
| Hook + About, 1 test item | Description/hook, expandable | P0 giữ overview, không lặp; loại test item khỏi publication |
| Iconic Landmarks, 3 masonry items | 0 guide items; destination board riêng | P0 giữ bài/linked destination đúng ID; P1 card có ảnh đã duyệt |
| Beaches, 2 masonry items | Board có Mỹ Khê/Non Nước nhưng Non Nước legacy | P0 bổ sung knowledge + VI Non Nước; không giả mọi biển bơi được |
| Why unmissable | Mô tả tóm tắt | P1 lý do đến cụ thể, tránh marketing lặp |
| Bucket list, 8 items | Không còn cấu trúc checklist | P1 giữ các gợi ý có nguồn trong nhóm Trải nghiệm; không giả checklist đã lưu |
| Zones, 3 items | Định hướng khu vực một đoạn | P1 chia khu vực/thời gian di chuyển khi có nguồn, link map/query rõ |
| Traveler types, 4 items | Không có nhóm tương đương | P1 tag nhu cầu có bằng chứng; tránh claim “an toàn cho mọi gia đình” |
| Food, 4 rail items | Ẩm thực/văn hóa một đoạn | P1 dish cards/ingredients/etiquette, phân biệt món vùng lân cận |
| Drinks, 3 rail items | Không có nhóm riêng | P1 giữ trong Ăn uống, mở rộng; không cần thêm một tab dài |
| Practical, 6 info items: festivals/best time/transport/shopping/hidden gems/connectivity | Transport/weather/before-you-go; các phần khác chưa tương đương | P0 thông tin thiết yếu; P1 nhóm theo câu hỏi, không dựng festivals/date không nguồn |
| CTA planner | Map/Create Trip mở route không city context | P1 CTA có city context, không booking/giá |
| Live things-to-do 12 | Preview4 → View all12, category/top-rated | Đã reachable trong runtime; P1 giảm khối ảnh rỗng, giữ count chính xác |
| Hero/source/gallery | Hero có ảnh; sources mới có; city gallery lấy từ featured destination | P0 ảnh đúng đối tượng/quyền; gallery không được ngụ ý tất cả là ảnh city đã duyệt |

Nguyên nhân cấu trúc: `catalog-localization.ts:55` tạo `layout:"snippets"`, items/tags rỗng, actionLabel/eyebrow null, IDs theo index. `loka/src/features/travel/city-guide.ts` còn thiếu `imageUrl` trong CityGuideItem; `city-guide-sections.tsx:54` dùng gradient/emoji, không render ảnh item. `snippets/highlights` cũng không render `items` như web. Cần canonical section ID ổn định, kiểu/layout/items/target và bản dịch, merge/precedence rõ giữa legacy guide và localized editorial. Không hardcode city trong app; không để hai editor đồng thời điều khiển cùng ý nghĩa mà không chỉ rõ precedence.

Đề xuất IA mobile cho city: hero gọn → overview 2–3 dòng → Map/Create trip → các nhóm **Tổng quan / Điểm đến / Ăn uống / Chuẩn bị / Gợi ý lịch trình / Nguồn** khi có nội dung. Chip có label ngắn bản địa hóa; nội dung trong nhóm dùng heading/expand; cho thấy còn nhóm khác. Có thể dùng anchor mục hoặc single-panel picker hiện tại; nếu giữ picker, phải giữ trạng thái theo section, cung cấp vị trí/counter và không biến các section khác thành không thể tìm thấy. Chỉ ẩn section rỗng, không cắt nội dung dài để đạt chiều cao mockup.

## 4. Ma trận parity destination — admin → API → mobile

| Nhóm | Nguồn hiện có | Hiện trạng mobile | Handoff |
|---|---|---|---|
| Identity/city/category | Base + localized title/location | Đúng Mỹ Khê/Đà Nẵng, category VI | P0 giữ canonical IDs/parent, không sample fallback |
| Overview/why visit | Mô tả mới ngắn; research sâu hơn | Một paragraph expandable | P0 bổ sung nội dung có cấu trúc, đầu màn ưu tiên lợi ích chuyến đi |
| Highlights/editorial sections | Schema có, importer để rỗng | DTO/mapper/render chưa hỗ trợ | P0 populate + end-to-end projection, fallback supported type |
| Visit duration/access/weather/reservation | Visit-profile contract | Chưa có dữ liệu; lỗi404 đã sửa ở API trong phiên | P0 null≠failure; giữ unknown; populate nguồn phù hợp |
| Location/entrance/map | Coordinates/base city, address chưa có ở mapper | Map query/coords; address hint | P0 không coi city centroid là entrance; ghi rõ mức chính xác |
| Opening/safety | Legacy opening; curated intentionally withheld | New record không hiện opening | P0 chỉ công bố đã xác minh; không suy từ lịch cũ |
| Tips | Localized tips | Có, nhưng ngắn | P0 nhóm hành động cụ thể + nguồn, không nhiều màu nền trang trí |
| Tags/ratings/visitors/rank | Legacy raw metadata | UI VI vẫn beach/swimming…; raw3250000 và18540 | P0 localize taxonomy; P1 bỏ rank khỏi hero, hide unverifiable metric hoặc label đúng provenance |
| Photos | Existing cover/gallery | Fallback khi403, gallery có count | P0 quyền/correctness; chỉ đếm asset có ý nghĩa, không empty tile carousel |
| Sources/freshness | sources.checkedOn và base lastCuratedAt | Có link/date; dates không đồng nghĩa | P0 revision/source metadata chính xác; lỗi openURL phải có feedback |
| Same-city/save/add-to-trip | API relationships/favorites/trips | Actions đã có | P0 đúng ID/permission/feedback; “cùng thành phố”, không gọi nearby khi chưa tính khoảng cách |
| Money | Legacy fields còn lưu; curated projection xóa | Catalog mapper bỏ money | P0 không giá ở toàn app, giữ storage/admin; web legacy giá là bằng chứng contract khác, không yêu cầu redesign web |

Target destination: ảnh/identity ngắn + city breadcrumb → một câu why visit → Save/Map → Highlights → Before you go (duration/access/weather/entry guidance) → Tips/etiquette → location/entrance → related → source/freshness. Add-to-trip ở footer có safe area và không che nội dung; statistics phụ nằm trong nhóm thông tin, không đứng trước kiến thức chính. Dùng gallery modal có dismiss/back/accessibility; không nút “More” rỗng.

## 5. Thiết kế toàn mobile — screen-by-screen

Các thứ tự dưới đây là quyết định thiết kế đề xuất, không mô tả screen đã implement. Rationale xuyên suốt: người dùng phải tìm được “đến đâu, vì sao, chuẩn bị gì, đi thế nào” trước nội dung quản lý/social. Không có market research, retention/conversion baseline hoặc dữ liệu persona để tính RICE chính xác; dùng MoSCoW/P0–P2 theo mức cản trở hành trình.

| Màn / ưu tiên | Cấu trúc mục tiêu và vấn đề giải quyết | Acceptance chính |
|---|---|---|
| Home / P1 | Greeting ngắn + search; năm city và đề xuất hữu ích; tiếp tục chuyến đi nếu có; collections; planning shortcut; social Demo sau kiến thức. Hiện WhosAround đứng trước city và trip card lớn ở đầu | Given new/returning traveler, when mở Home, then search/city dễ thấy, mọi section có destination đúng; không empty fake content; thứ tự không làm mất saved trip |
| Search / P0 data, P1 layout | Input gọn; All/Places/Cities/People; suggested city/queries trước nhập; nhóm kết quả đúng loại. Giữ People theo yêu cầu cũ nhưng Demo riêng và đứng sau travel data | Given query VI/không dấu, when nhập/filter/clear/back, then kết quả đúng city/place, state/scroll giữ hợp lý, retry từng nhóm; không giấu kết quả sau bàn phím |
| City / P0 | IA tại mục3; preview attractions thay các khối trống cao; full list/counter/filters thực | Given đủ12, when view all/filter/back, then không mất item, selected section còn, không nhầm total loaded/server |
| Destination / P0 | IA tại mục4; thay hero quá cao bởi identity+why visit; reveal practical knowledge sớm | Given Mỹ Khê, when mở, then không phải đi qua visitor/rank/raw tags mới đến thông tin; null knowledge hiển thị unknown, nonempty sections đều reachable |
| Collection / P1 | Title + description/intent nếu có; result count; list chung; empty/error/not-found tách; load more nếu API có cursor | Given invalid/empty collection, then không đổi sang unrelated feed và có đường quay lại; title dài không bị cắt mất ý |
| Favorites / P0 state, P1 layout | Search/filter + saved list duy nhất; Recent chỉ khi hữu ích; đưa Food/City nếu catalog có; recent View all phải ở saved scope | Given không có favorite hoặc fetch lỗi, then hai state riêng; current source chỉ lấy favorites bỏ query flags và View all dẫn collection/new phải sửa |
| Trips / P1 | Upcoming/past/saved plan grouping rõ; card title/date/city/state; Create Trip một CTA; không nhiều badge/font900/metadata9–11 | Given có nhiều loại record, when chọn card, then vào đúng trip/plan, không cần hiểu nội bộ planning workspace; no monetary summary |
| Create New Trip / P0 | City → date/party → interests/travel style → review; Low/Medium/Luxury không tiền; giữ draft khi Back; prefill city từ City | Given city CTA, when mở/create, then city được chọn, không numeric budget/currency/amount chip, validation inline, keyboard không che Continue; chưa tự submit trong BA |
| Planner tab / P1 | Workspace list/continue trước wizard; phân biệt tạo trip với gợi ý kế hoạch; cấu hình sở thích theo từng bước | Given existing draft, when resume/dismiss/reopen, then không mất input; không giả gợi ý đã xác minh; no money trong generated/saved prose |
| Trip detail / P0 price, P1 layout | Header/title/date/city → itinerary/days/places → sharing/members → secondary management. Edit sheet chỉ short tasks | Given legacy trip có budget/bookings, then không amount ở hero/edit/booking row; stored data giữ; các action owner/member phù hợp |
| Plan detail / P0 price, P1 layout | Summary + route → day navigator → activities/practical notes → associated places; hotels/stays nếu giữ phải không nightly money | Given saved generated plan, then amount/ticket-price prose không lộ; source/uncertainty rõ, long days mở rộng accessible |
| Profile / P1 | Cover/avatar/name/bio + compact stats + Trips/Photos/Saved; giữ swipe và touch tabs; không Back ở own tab | Given long VI name/large font, then không overlap; empty mỗi tab riêng; Saved consistent với Favorites; ảnh tỉ lệ hợp lý, không ép 3 cột khi chữ lớn |
| Traveler profile / P2 | Giữ identity + Demo rõ; Trips/Photos/Saved privacy state; social không trở thành route chính | Given demo place slug không có API canonical entity, then không dẫn dead destination; đề xuất giảm ưu tiên, chưa silently remove People/WhosAround |
| Settings / P1 | Account/edit → language → support/legal → sign out; disabled/unavailable links minh bạch | Given VI/EN switch, then UI+catalog+cache thống nhất, error feedback, không coi nguồn title tiếng Anh là UI label; không đổi settings trong review |
| Sign in / P1 QA | Compact brand/value + sign-in + progress/error/retry + link chính sách nếu available | Given failed/cancelled auth, then quay lại an toàn, không fake logged-in state; runtime chưa thử logout/login |
| Booking/new / P0 scope | Route hiện có gate knowledge-only. Giữ Add-to-trip; không bật lại transactional wizard để parity | Given direct deep link, then explanatory state/back, không price/payment CTA. Không xóa dữ liệu booking lịch sử |

### Shared components/refactor đề xuất

1. **ScreenHeader:** back khi stack, title co giãn, optional trailing action chỉ khi có handler. `travel-screen-header.tsx:49` có ellipsis không onPress; bỏ affordance hoặc nối action thật. Không đổi thành menu giả.
2. **SearchField / FilterChip:** cùng height48–52 logical units làm target ban đầu, label15–16, icon20–22; vùng chạm iOS≥44pt/Android≥48dp. Font scaling phải mở rộng, không fixed height cắt chữ. Search hiện min54 không phải lỗi tự thân; Home pill và density mới cần đo thật.
3. **PlaceCard / PlaceRow / CityCard / TripCard:** identity/meta/actions nhất quán, ảnh catalog qua cùng resolver/fallback. Place hero16:9 hoặc4:3, grid4:3, list72–88 square là đề xuất; two-column chỉ khi chữ/tên vừa, fallback list ở hẹp/large text. Không masonry cao cho hàng loạt empty images.
4. **KnowledgeSection / FactRow / ExpandableText / SourceList:** thông tin theo câu hỏi; phần cốt lõi luôn visible, phần phụ mở rộng bằng tap; tránh mỗi đoạn một gradient; trạng thái expanded/selected đọc được bằng screen reader. Heading là heading, decorative icon không đọc như ký tự Ionicons.
5. **QueryState:** phân biệt initial loading, refresh, empty, notfound/unpublished, offline/stale, failure/retry, unknown fact. Không spinner vô hạn hoặc demo fallback. Dữ liệu stale phải ghi rõ nếu có.
6. **ActionBar / BottomSheet:** primary thumb-reachable, footer không che last item, scroll padding tính safe area; sheet cho chọn trip/filter/date ngắn, article dài dùng full screen. Back/Android hardware back/dismiss/native swipe không tạo record ngoài ý muốn.
7. **Type/spacing:** body16/24, secondary14/20, section22/28 weight600, page28–32/34–40; gutter20, gap section24–32, card padding16–20, radius16–24. Đây là starting spec theo Home/Profile, không khóa accessibility vào pixel. Metadata thiết yếu tránh9–11pt và font900 dày đặc ở Trips/Plan detail. Preserve native scrolling và không resize toàn app chỉ để khớp screenshot.

## 6. Màu bề mặt — phạm vi chính xác

Đã đối chiếu screenshot với source: `theme.ts:415` khu vực lightColors có body `#F8F7F5`, header `#636A71`, accent `#2045E8`; HomeScreen background dùng header. `recent-trip-card.tsx:77` và `home-sheet-content.tsx:194` dùng `#232C33`; completion status dùng success `#33AC5A` trên green50 `#EDFCF2`. Guide dùng7gradient và destination hero `#ffe6d5→#ffd7e8→#e6d8ff`. Profile nền trắng/cover ảnh đã phù hợp hướng trung tính; không phủ màu lên ảnh.

| Semantic surface | Màu target | Foreground | Components trong scope |
|---|---|---|---|
| Base/card | Giữ `#F8F7F5` / `#FFFFFF` | `#18232D` chính, `#566573` phụ tại surface mới | Shared screen/card nền trung tính |
| Selected large header | `#EAF4F7` pale sky | `#18232D` / `#566573` | HomeScreen background + HomeHeader/HomeHero tint; header lớn mới nếu thật sự tương đương |
| Planning/info banner | `#EDF2FF` soft blue | cùng foreground; blue action `#2045E8` | Home plannerActivity; KnowledgeSection informative wash; destination intro wrapper |
| One featured-trip emphasis | `#183D56` deep ocean | `#FFFFFF` / `#DCE8EF` | HomeTripCard và RecentTripCard variant home, cùng vai trò; không mọi card |
| Primary action | Giữ `#2045E8` | `#FFFFFF` | CTA/selected control, không dùng nền trang |
| Positive badge text | `#217A42` trên `#EDFCF2` | label/icon status cùng semantic | RecentTripCard, Trips/Plan status có cùng pair; không thay tất cả success decorations |

Không đổi toàn foundationColors hàng loạt. Tạo semantic token có tên vai trò để không phá consumer của header/muted; giữ `src/global.css` và theme source nhất quán trong mobile, không propagate sang admin/web. HomeHeader đang interpolate foreground trắng↔đen khi sheet kéo: khi header chuyển sáng, cập nhật cả endpoints và kiểm tra intermediate contrast, status bar text/icons; không chỉ thay background. Home search icon gray300 trên trắng quá nhạt cho essential affordance: dùng foreground hỗ trợ đủ3:1.

Contrast được research parent tính theo sRGB: dark title/pale sky14.26:1; secondary5.36:1; blue6.10:1; soft blue14.23/5.35/6.09; white/deep ocean11.41:1; light secondary9.14:1; white/currentblue6.82:1. White/pale sky1.12:1 không đạt. Existing success pair≈2.76:1; proposed green≈5.04:1. Developer đo lại rendered pairs/opacity/gradient/photos và mọi pressed/disabled/focus state; không chỉ kiểm tra token. Text thường≥4.5:1; essential icon/indicator≥3:1; trạng thái phải có text/icon, không chỉ màu.

Tham chiếu từ research parent: [creator mobile design](https://dribbble.com/shots/27192922-Tripzen-AI-Trip-Planner-Mobile-App-Design), [creator planning](https://dribbble.com/shots/27238942-Tripzen-AI-Travel-Planner-Chat-Planning-Experience). UI8 không fetch được ở pass đó; không khẳng định đây là token export từ kit, không mua kit. [WCAG text](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).

## 7. Stories, dependency và acceptance gate

**K09/P0 — Nội dung đủ từ admin đến traveler.** Người đi du lịch muốn hiểu từng nơi để tự chuẩn bị. Outcome: không chỉ một mô tả ngắn và ảnh rỗng. Given published EN/VI có sections/items/sources, when editor cập nhật rồi app refresh, then cùng revision hiển thị đúng entity và tất cả supported nonempty content truy cập được, không rebuild. Draft/reviewNotes không public. Phụ thuộc canonical contract/translation precedence, editorial signoff và nguồn. Test admin edit→API→mapper→screen bằng dữ liệu test phù hợp; BA không tự mutate live.

**K10/P0 — Unknown không thành lỗi.** Người dùng muốn biết thông tin nào chưa được bổ sung. Given existing destination absent visit-profile, when EN/VI fetch, then valid nullable response + unknown state; absent destination/draft vẫn đúng404; network error vẫn Retry. Middleware semantics đã sửa; giữ contract test cả header/noheader và xác minh UI sau refresh. Không mở ticket trùng.

**K11/P0 — Hình đúng và bền.** Given empty/403/slow/invalid/cached image, when mở city/card/detail, then có neutral fallback hợp lý, title/actions vẫn đọc được, không photo count giả; approved replacement từ admin xuất hiện sau refresh/cache policy. Phụ thuộc approved assets/R2/public URL. Test thật thiết bị không dùng localhost origin của dev machine.

**K12/P0 — Một ngôn ngữ nhất quán.** Given VI UI, when search/detail/related, then heading/category/tag/country/date/action/error đều VI hoặc fallback có thông báo; không raw English taxonomy. EN tương tự. Cả5 legacy được inventory; không silently drop để báo100%. Source label chính thức và proper nouns được giữ hợp lý. Phụ thuộc translated taxonomy + localized legacy records + locale cache keys, gồm visit-profile khi chứa prose.

**K13/P0 — No-price toàn hành trình.** Given legacy monetary fields/saved generated prose, when Home/Search/City/Destination/Favorites/Profile/Trips/CreateTrip/Planner/Trip/Plan/deep-link render hoặc screen reader đọc, then không tiền/currency/price section/price sort/free-entry badge. Low/Medium/Luxury là qualitative độc lập, không derive từ numeric. Backend/admin storage giữ nguyên; số ngày/giờ/count không bị regex xóa. Current remaining source: `travel-plan-screen.tsx:210,338,681`, `trip-detail-screen.tsx:128,244,284`, `travel-plan-detail-screen.tsx:49,51`. Data policy phải xử lý prose ngoài field names.

**K14/P1 — Kiến thức ưu tiên và dùng bằng một tay.** Given narrow phone/large text/longVI, when browse/search/expand/back, then identity+primary next action rõ, không clipping/overlap, readable hierarchy, nội dung đã mở và search/filter giữ đúng khi quay lại. City context đi vào CreateTrip/Add-to-trip. Phụ thuộc shared components rồi core screens; kiểm tra iOS/Android thật hoặc simulator, không chỉ web responsive.

**K15/P1 — Màu và states thống nhất.** Given các surface target và trạng thái sheet/pressed/loading/error, when so sánh before/after cùng data/device/scroll, then foreground đúng pair, contrast đạt, semantic status có label/icon, không broad recolor ảnh. Tách screenshots màu khỏi content khác revision để so sánh đáng tin.

**K16/P1 — Actions có ích và navigation đúng.** Given visible CTA/ellipsis/View all, when tap, then có kết quả đúng scope và feedback hoặc affordance bị loại rõ; Favorites View all không sang new collection; map failure có feedback; back/dismiss không mất draft hoặc tạo thay đổi. Không thêm chức năng social/payment để lấp button trống.

MoSCoW: Must = K09–13 và core navigation/state correctness; Should = K14–16, section/visual improvements; Could = personalized sorting sau khi có evidence; Won't Phase1 = booking/payment/monetization mới, AI/social expansion, admin redesign, framework upgrades/migrations không liên quan. Không đặt deadline hay RICE score giả; developer estimate sau contract decision.

## 8. Mobile skills và verification yêu cầu developer

Trước implementation/testing, dùng skill phù hợp đang available: `building-react-native-apps:react-native-best-practices`, `building-react-native-apps:react-navigation`, `testing-react-native-apps:agent-device`, `testing-react-native-apps:dogfood`; `testing-react-native-apps:react-native-testing` khi viết test. Nếu catalog không có, kiểm tra `.agents/skills` liên quan và báo unavailable. BA dùng hướng dẫn agent-device và CUA cho kiểm tra read-only. Supported thread read ngày17/10 xác nhận developer đã đọc bốn SKILL.md đầu tiên bằng lệnh thành công; chưa có bằng chứng dùng react-native-testing hay hoàn tất native test plan. Việc đọc skill không đồng nghĩa implementation/QA đã đạt.

Record nghiệm thu phải ghi skill dùng, source/content revision, platform/device/OS, locale/font scale, cases passed/failed và gap. Test contract/behavior nơi rủi ro (nullable profile, publication, locale, pagination, deep links, mutations) thay vì test lặp lại style constant. Chạy checks yêu cầu repo; không upgrade dependency chỉ để review.

Visual QA: iPhone hẹp + iPhone17Pro, Android supported viewport/device; font scale1.0 và tối thiểu1.3/large accessible; EN/VI dài; keyboard search/form/date sheet; safe-area top/bottom; tabs/native stack/back; empty/one/many/missing image/403/offline/slow refresh/error; long city/destination title; screen-reader order/labels/selected/expanded; reduced motion; scrolling/list memory/image decode. Không chứng nhận Android nếu chỉ test iOS.

Release checklist: đủ5city và42destination inventory; mọi promoted card + all-results reachable; mutation save/add-to-trip chạy bằng account/test context được phép; unauthorized admin/draft private; image rights/date/source coverage; no-price scan **và** runtime; source links fail gracefully; clean before/after screenshots core screens. Test HTTP200 ảnh không thay visual/rights QA.

### 8.1. QA bổ sung EN và màn phụ — 17/10/2026, kết thúc khoảng 16:17 UTC

Thực hiện trên **máy người dùng**, native Simulator iPhone 17 Pro / iOS 26.5 qua CUA. App/server đang chạy và working tree có sửa dở. Locale ban đầu VI, tạm đổi EN để kiểm tra, đã khôi phục VI và xác minh Settings “Ngôn ngữ, Tiếng Việt”. Font scale không đo hoặc đổi; không chứng nhận cỡ chữ mặc định hay chữ lớn. Bằng chứng bổ sung là quan sát UI/accessibility trực tiếp và source đối chiếu; không có bộ screenshot mới lưu bền.

| Case | Kết quả quan sát | Gate / hành động |
|---|---|---|
| EN CreateTrip bước 1→2→3 | Chọn Da Nang tự điền “Trip to Da Nang”; date sheet mở và Cancel giữ 17–21/10; bước 3 vẫn có numeric input và preset ₫5/10/20/50 triệu | **Fail K13**, runtime xác nhận issue đã giao; dùng qualitative Low/Medium/Luxury nếu cần, giữ backend money. Source `travel-plan-screen.tsx:336` |
| Wizard back/cancel | Back 3→2 giữ date; Back 2→1 giữ name/Da Nang; Cancel về Planner, vẫn 2 Trips | Pass mẫu navigation; không bấm Create and plan, không chứng nhận create mutation |
| CreateTrip copy/scope | Placeholder “e.g. Autumn in Kyoto”; city options có Hoian ngoài 5 city rollout | P1: dùng ví dụ VN; giữ legacy history, thống nhất chỉ 5 city được đề xuất. Không xóa Hoian records |
| Favorites View all | Từ Recent Added→Detail→“Could not load this place. Please try again.”; Back về Favorites | **Fail K16**; runtime xác nhận route sai đã nêu. Given saved list, when View all, then tới đầy đủ saved list/filter, không entity lỗi |
| Favorite accessibility | Recent card đã saved nhưng AX “Save My Khe Beach”; detail ghi Saved đúng | **P1 mới**: `destination-card.tsx:64` dùng label toggleFavorite không theo state. Given saved, when screen reader focus, then label/state phản ánh đã lưu và action bỏ lưu; không toggle chỉ để test trên tài khoản thật |
| VI Profile | Trips/Photos/Saved/Followers/Following vẫn English; `vi.ts:23` chứa chính các string này | **P1/K12**: dịch static UI; giữ proper names/user captions. Không tự dịch tên trip hoặc caption do user tạo |
| Profile/Settings locale | Saved tab giữ selected sau Settings→Back; My Khe đổi EN và Settings đổi VI đúng | Pass subset locale/state; đã khôi phục VI. Payment/help/legal/rating/delete account hiện disabled; copy “24/7” chưa được kiểm chứng |
| EN My Khe→Da Nang | Details/tip/sources load, không visit-profile Retry; Explore city đúng Da Nang; Show all chuyển 4/12→12/12; back về detail rồi Favorites | Pass mẫu K10 và navigation; ảnh/depth/legacy locale vẫn là issue riêng, không suy ra 42 screen đã đạt |
| EN MyTrip/detail | Danh sách 2 Trips; mở existing Trip “Mia thu”, route/people/empty bookings đọc được; back trả list | Read-only pass cơ bản; không Edit/Delete/Invite/Accept/Booking. Record này không có budget hiện, không chứng minh mọi Trip đạt no-price |
| Keyboard/touch/large text | Name input focus, footer có mặt; software keyboard không hiện trong quan sát | **Chưa đủ điều kiện chứng nhận** keyboard avoidance, measured touch target, large text, VoiceOver đọc thực. AX label check không thay VoiceOver session |
| Android | SDK/ADB và AVD cấu hình có sẵn; `adb devices` thành công nhưng list empty | **Coverage gap**: không có active Android app environment. Không boot/install chỉ để đánh dấu coverage |

**Ý nghĩa số liệu:** 37 là destination newly researched/localized trong gói biên tập; 42 là toàn bộ destination thuộc 5 city ở API snapshot, gồm 37+5 legacy. 84 là localized rows (5 city+37 destination)×2 locale, không phải 84 địa điểm. 31 empty +11 GET403 là 42 trường destination cover; 3 empty +2 GET200 là 5 city cover. Không đếm gallery assets, không khẳng định HTTP200 = đúng chủ thể/quyền sử dụng. API snapshot cũ vẫn là mốc 15:56 UTC; QA này không đổi content counts hoặc được xem như lần import mới.

**Developer acknowledgement:** task **Thiết kế lại trang cá nhân**, ID `01a14871-5dcd-7161-9d2a-82f5238d31e3`, được đọc qua supported app tool; latest turn đã completed/idle. Developer đã nêu ưu tiên no-price/content/layout và đọc 4 skills; final của turn đó chỉ xác nhận import 84 bản +268 checks. **Chưa có bằng chứng handoff thiết kế/no-price đã hoàn thành.** Yêu cầu record device/OS/locale/font scale/pass-fail và gaps đã gửi; chưa nhận test matrix hoàn chỉnh. Giữ cùng task, không tạo implementation task trùng.


## 9. Assumptions và sources log

| Loại | Nội dung / độ tin cậy |
|---|---|
| Verified source/runtime | Source files nêu trên; API snapshots, CSV42rows, image GET results; same UUID đã hiện Danang web và Đà Nẵng API/mobile |
| Verified import vs release | Import report84rows và API EN/VI có data; không đồng nghĩa knowledge hoàn chỉnh, usable images hay release-ready |
| Verified screenshot | File Library đã tải Mac, readable và xem pixels; screenshot Home có US$235, nhưng là thời điểm ảnh chụp, không tự chứng minh Home code hiện còn amount (recent-trip mapper/card đã thay đổi) |
| Design assumption — high | Traveler muốn discovery/knowledge trước social theo user scope; reorder đề xuất vẫn phải giữ explicit Demo feature trừ khi quyết định loại |
| Design assumption — medium | Body16 và card ratios trên tạo nhịp tốt; cần đo trên supported devices/large text; không suy kích thước logical từ942px screenshot |
| Unknown | Audience segmentation, monetization, analytics baseline, licensing của ảnh cũ, operational truth của mọi fact/rating; không invent personas/market sizing |
| Runtime limits | VI core và EN subset/màn phụ trên iPhone17Pro iOS26.5, mục8.1; API toàncatalog không phải42screen visual pass; chưa Android/large text/performance/mutation pass |
| Concurrency | Working tree đang thay đổi bởi developer; line references là snapshot17/10, developer reconcile trước chỉnh |

Supporting references: `pland/docs/bilingual-catalog.md`; `pland/src/schema/trips/catalog-content.ts`; `pland/src/http/catalog-localization.ts`; `pland/scripts/import-bilingual-catalog.ts`; `pland/ui/src/modules/Explore/screens/{CityDetailPage,DestinationDetailPage}.tsx`; `loka/src/features/travel/{city-guide.ts,services/travel-api-service.ts,components/city-guide-sections.tsx,components/catalog-image.tsx,components/content-sources.tsx,screens/city-detail-screen.tsx,screens/destination-detail-screen.tsx}`. Các path đều tính từ workspace root trừ khi ghi rõ `loka/docs`.

## 10. Key insights, quyết định và bước tiếp

Điểm nghẽn hiện nay là độ sâu/độ tin cậy nội dung và contract projection, không thiếu số lượng screen. Nâng màu không chữa được42place thiếu practical facts; thêm text không chữa đượcnull404; giữ rich guide không có nghĩa giữ test content/quảng cáo. Thiết kế phải cùng đi với semantics dữ liệu.

Quyết định developer cần chốt trong scope đã được user cho phép: canonical localized section/item model và precedence; cách đưa5legacy vào EN/VI; nhóm/anchor mobile; semantic surface tokens; chính sách fallback/asset approval; revision/freshness metadata. Đề xuất giữ People/WhosAround nhưng đặt sau knowledge và giữ Demo; việc bỏ feature cần nêu rõ riêng, không ngầm xóa. Chưa có owner editorial/licensing được xác minh; ghi người chịu trách nhiệm trước publication ảnh/facts mới.

Thứ tự giao: (1) regression UI null-profile sau bản sửa và xử lý no-price remaining routes; (2) canonical sections + bổ sung42record coverage/VI taxonomy/ảnh; (3) shared tokens/components, Home→Search→City→Destination→Favorites; (4) Trip/CreateTrip/Planner/Profile/Settings và routes phụ; (5) mobile regression record + BA/design re-review. Không tạo task developer trùng, không rewrite admin UI, không chạy full historical migrations (backend journal có cảnh báo trong tài liệu developer).

Deliverable này thay thế bản parity provisional “runtime verification pending” về bằng chứng đã cập nhật; vẫn giữ các giới hạn runtime nêu rõ. Implementation chưa được BA chứng nhận hoàn tất.
