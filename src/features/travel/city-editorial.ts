/** Presentation model for future BE editorial content. No API contract is assumed. */
export type CityEditorial = {
  preview?: boolean;
  headline: string;
  intro: string;
  moods: readonly string[];
  experiences: readonly { title: string; description: string }[];
  areas: readonly { title: string; audience: string; description: string }[];
  food: readonly { title: string; description: string }[];
  practical: readonly { title: string; description: string }[];
};

// Layout-only copy adapted from the user's template, deliberately scoped to Da Nang.
// Do not treat sample season, transport or activity notes as verified/live information.
const vi: CityEditorial = {
  preview: true,
  headline: "Một nhịp sống, nhiều cách khám phá",
  intro: "Buổi sáng bên biển, buổi chiều giữa những ngôi chùa và khu chợ, rồi chậm lại với một bữa hải sản. Đà Nẵng trong template này là sự giao thoa giữa thiên nhiên và nhịp sống thành thị — để bạn chọn nghỉ ngơi hay khám phá theo cách riêng.",
  moods: ["Biển & thư giãn", "Thiên nhiên", "Văn hóa", "Ẩm thực"],
  experiences: [
    { title: "Đón ngày mới ở Sơn Trà", description: "Một góc nhìn khác về thành phố, giữa màu xanh của núi và biển." },
    { title: "Khám phá Ngũ Hành Sơn", description: "Dành thời gian cho hang động và chùa; hành trình có những đoạn leo bậc." },
    { title: "Chậm lại bên Mỹ Khê", description: "Dạo bờ biển hoặc tìm hiểu một lớp học lướt sóng phù hợp." },
    { title: "Một buổi dành cho văn hóa", description: "Gợi ý từ template: Bảo tàng Chăm, chợ Hàn và cầu Rồng." },
  ],
  areas: [
    { title: "Trung tâm", audience: "Văn hóa · Cà phê · Mua sắm", description: "Phù hợp khi bạn muốn khám phá phố xá, ghé chợ và dành thời gian ở các quán cà phê. Một gợi ý cho chuyến đi solo thích nhịp sống đô thị." },
    { title: "Mỹ Khê", audience: "Nghỉ dưỡng · Gần biển", description: "Gợi ý cho những ngày ưu tiên bãi biển, hàng quán và chỗ ở ven biển. Gia đình có thể cân nhắc khu vực này theo nhu cầu riêng." },
    { title: "Sơn Trà", audience: "Thiên nhiên · Khám phá", description: "Dành cho người muốn tìm một nhịp chậm hơn và những góc nhìn hướng ra biển. Kiểm tra điều kiện tiếp cận trước khi lên lịch." },
  ],
  food: [
    { title: "Mì Quảng", description: "Một hương vị miền Trung để mở đầu hành trình ẩm thực." },
    { title: "Hải sản", description: "Một bữa ăn ven biển; hỏi giá và cách tính trước khi gọi món." },
    { title: "Bánh mì", description: "Gợi ý gọn nhẹ giữa những buổi khám phá phố phường." },
    { title: "Cao lầu ở Hội An", description: "Thêm vào danh sách nếu chuyến đi có ghé Hội An, không phải đặc sản riêng của Đà Nẵng." },
  ],
  practical: [
    { title: "Chọn thời điểm đi", description: "Template gợi ý một kỳ nghỉ thiên về nắng và biển. Chưa có dữ liệu mùa hoặc dự báo được xác minh tại đây; hãy kiểm tra thời tiết sát ngày đi trước khi chốt hoạt động ngoài trời." },
    { title: "Di chuyển trong thành phố", description: "Taxi, xe công nghệ và xe buýt là các lựa chọn được nhắc đến trong template. Tuyến đường, giờ hoạt động và giá sẽ được bổ sung từ dữ liệu thực tế sau." },
    { title: "Chợ, mua sắm & góc nhỏ", description: "Bắt đầu với chợ Hàn, rồi dành một khoảng trống cho quán cà phê hoặc khu phố bạn bắt gặp. Các gợi ý này chưa phải danh sách cơ sở được xác minh." },
    { title: "Sự kiện & kết nối", description: "Lịch lễ hội sẽ cần được cập nhật theo ngày đi. Với SIM và Wi-Fi, hãy kiểm tra lựa chọn tại nơi lưu trú; màn hình chưa cung cấp giá hoặc chất lượng kết nối trực tiếp." },
  ],
};

const en: CityEditorial = {
  preview: true,
  headline: "One city, many ways to unwind",
  intro: "A morning by the sea, an afternoon among temples and markets, then a seafood dinner at your own pace. This template introduces Da Nang through the meeting of nature and city life — with room for both rest and discovery.",
  moods: ["Beach escapes", "Nature", "Culture", "Local flavors"],
  experiences: [
    { title: "Start the day on Son Tra", description: "Discover a different perspective on the city, between forest and sea." },
    { title: "Explore the Marble Mountains", description: "Make time for caves and pagodas; expect steps along the way." },
    { title: "Slow down at My Khe", description: "Walk along the beach or look into a suitable introductory surf lesson." },
    { title: "Make room for culture", description: "Template ideas: the Cham Museum, Han Market and Dragon Bridge." },
  ],
  areas: [
    { title: "City centre", audience: "Culture · Cafes · Shopping", description: "A base for streets, markets and cafe stops. An idea for solo travelers who enjoy an urban atmosphere." },
    { title: "My Khe", audience: "Slow stays · Seaside", description: "For days built around the beach, restaurants and coastal stays. Families can consider this area according to their own needs." },
    { title: "Son Tra", audience: "Nature · Exploring", description: "An idea for a quieter pace and sea views. Check access conditions before planning your route." },
  ],
  food: [
    { title: "Mi Quang", description: "A taste of central Vietnam to start your food journey." },
    { title: "Seafood", description: "Make time for a seaside meal; confirm pricing before ordering." },
    { title: "Banh mi", description: "A quick bite between walks and discoveries." },
    { title: "Cao lau in Hoi An", description: "An idea for a side trip to Hoi An, rather than a Da Nang-specific specialty." },
  ],
  practical: [
    { title: "When to go", description: "The template suggests a sunshine-and-seaside escape. Verified seasonal data and forecasts are not available here yet; check conditions near your travel date before committing to outdoor activities." },
    { title: "Getting around", description: "The template mentions taxis, ride-hailing and buses. Routes, operating hours and fares will be added from actual data later." },
    { title: "Markets & small discoveries", description: "Start with Han Market and leave room for a cafe or neighborhood you happen upon. These ideas are not a verified business directory." },
    { title: "Events & staying connected", description: "Festival dates need to be checked for your trip. Ask your accommodation about SIM and Wi-Fi options; live prices and connection quality are not available here." },
  ],
};

export function getCityEditorialPreview(id: string, name: string, language: string): CityEditorial | undefined {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z]/g, "");
  if (id !== "3f5d650f-ad92-4b78-8d11-ad7e8fcf7c1f" && !["danang", "danangcity"].includes(normalized)) return undefined;
  return language.startsWith("vi") ? vi : en;
}
