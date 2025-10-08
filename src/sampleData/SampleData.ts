export const taskListData = (creatorId: string, eventCreatedDate: Date = new Date()) => {
  // Helper function để tính toán ngày
  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  const addWeeks = (date: Date, weeks: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + (weeks * 7));
    return result;
  };

  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Tính toán thời gian cho từng giai đoạn
  const phase1Start = eventCreatedDate;
  const phase1End = addMonths(phase1Start, 5);

  const phase2Start = phase1End;
  const phase2End = addMonths(phase2Start, 3);

  const phase3Start = phase2End;
  const phase3End = addMonths(phase3Start, 4);

  const phase4Start = phase3End;
  const phase4End = addMonths(phase4Start, 2);

  const phase5Start = phase4End;
  const phase5End = addMonths(phase5Start, 2);

  const phase6Start = phase5End;
  const phase6End = addMonths(phase6Start, 1);

  const phase7Start = phase6End;
  const phase7End = addWeeks(phase7Start, 2);

  const phase8Start = phase7End;
  const phase8End = addWeeks(phase8Start, 1);

  const phase9Start = phase8End;
  const phase9End = addDays(phase9Start, 1);

  const phase10Start = phase9End;
  const phase10End = addDays(phase10Start, 1);

  const phase11Start = phase10End;
  const phase11End = addMonths(phase11Start, 3);

  return [
    {
      phaseTimeStart: phase1Start.toISOString(),
      phaseTimeEnd: phase1End.toISOString(),
      tasks: [
        {
          taskName: "Hai bên gia đình cùng bàn bạc và thống nhất ngày ăn hỏi, ngày cưới.",
          taskNote: "Thống nhất ngày cụ thể để tiện cho việc lên kế hoạch.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Xây dựng ngân sách dự kiến cho toàn bộ chi tiêu.",
          taskNote: "Ước tính các khoản chi lớn và nhỏ để có cái nhìn tổng quan.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lập danh sách khách mời lần đầu (dự kiến).",
          taskNote: "Lên danh sách khách từ cả hai phía gia đình và bạn bè.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tìm hiểu các phong cách, xu hướng và ý tưởng tổ chức hôn lễ.",
          taskNote: "Tham khảo trên mạng, tạp chí để định hình phong cách đám cưới.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Khảo sát và so sánh những địa điểm tổ chức tiệc cưới.",
          taskNote: "Xem xét các nhà hàng, khách sạn về giá cả, sức chứa, dịch vụ.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tìm hiểu và liên hệ sơ bộ các nhà cung cấp dịch vụ cưới.",
          taskNote: "Lên danh sách các nhà cung cấp chụp ảnh, trang trí, trang điểm...",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lên phương án về chỗ ở sau hôn lễ cho vợ chồng.",
          taskNote: "Bàn bạc về việc ở riêng hay chung, chuẩn bị nhà cửa.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase2Start.toISOString(),
      phaseTimeEnd: phase2End.toISOString(),
      tasks: [
        {
          taskName: "Chốt địa điểm tổ chức tiệc cưới và đặt giữ chỗ.",
          taskNote: "Ký hợp đồng và đặt cọc để giữ chỗ.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lựa chọn chủ đề/ý tưởng cưới: phong cách, tông màu, cách trang trí.",
          taskNote: "Quyết định chủ đề chính để các dịch vụ khác làm theo.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Liên hệ và đặt dịch vụ với các bên: trang trí (ăn hỏi, lễ gia tiên, tiệc cưới), chụp ảnh, quay phim, thiệp cưới, hoa cưới, xe đưa đón, photo booth…",
          taskNote: "Đặt cọc các nhà cung cấp dịch vụ đã chọn.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lập kế hoạch tuần trăng mật hoặc tiệc chia tay độc thân: chọn địa điểm, đặt vé, khách sạn.",
          taskNote: "Chọn địa điểm, đặt vé máy bay, khách sạn.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Kiểm tra sức khỏe tiền hôn nhân cho cả hai.",
          taskNote: "Thực hiện các xét nghiệm cần thiết.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Bắt đầu đi thử trang phục cưới, lễ phục ăn hỏi.",
          taskNote: "Tìm hiểu các tiệm áo cưới và veston.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chuẩn bị quỹ dự phòng phát sinh, kiểm tra thủ tục giấy tờ hôn nhân.",
          taskNote: "Dành ra một khoản cho các chi phí không lường trước và chuẩn bị giấy tờ.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase3Start.toISOString(),
      phaseTimeEnd: phase3End.toISOString(),
      tasks: [
        {
          taskName: "Chuẩn bị cho lễ ăn hỏi: lễ vật, nghi thức, dàn bưng quả, đặt cỗ, thuê xe đưa đón.",
          taskNote: "Lên danh sách chi tiết các mục cần chuẩn bị.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chọn trang phục cho ăn hỏi: dành cho cô dâu chú rể và người thân.",
          taskNote: "Chọn áo dài cho cô dâu và trang phục cho chú rể, gia đình.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Đặt lịch make up, nail và làm tóc thử cho ngày ăn hỏi và ngày cưới.",
          taskNote: "Thử trước để chọn phong cách trang điểm phù hợp.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Quyết định may hoặc thuê váy cưới, áo dài, suit.",
          taskNote: "Chốt phương án và đặt cọc.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Thực hiện chụp hình Pre-wedding.",
          taskNote: "Chọn địa điểm và concept chụp hình.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Mua nhẫn cưới.",
          taskNote: "Chọn kiểu dáng và chất liệu nhẫn.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Rà soát, tinh gọn danh sách khách mời lần 2.",
          taskNote: "Chốt lại danh sách khách mời chính thức.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Xây dựng kịch bản chương trình tiệc.",
          taskNote: "Lên timeline chi tiết cho buổi tiệc.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Đặt ban nhạc, ca sĩ nếu cần.",
          taskNote: "Chọn ban nhạc phù hợp với phong cách đám cưới.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Mua sắm đồ đạc cho tổ ấm mới và phòng tân hôn.",
          taskNote: "Lên danh sách và mua sắm dần.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase4Start.toISOString(),
      phaseTimeEnd: phase4End.toISOString(),
      tasks: [
        {
          taskName: "Chuẩn bị phụ kiện cho cô dâu – chú rể.",
          taskNote: "Mua giày, trang sức, cà vạt, hoa cài áo...",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chốt mẫu thiệp và tiến hành in (nếu có dress code thì in kèm).",
          taskNote: "Kiểm tra kỹ thông tin trước khi in hàng loạt.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tập luyện First Dance hoặc các tiết mục riêng.",
          taskNote: "Nếu có kế hoạch biểu diễn trong tiệc cưới.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn tất album ảnh, video Pre-wedding.",
          taskNote: "Chọn ảnh, duyệt layout và nhận sản phẩm cuối cùng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chọn menu và thử món ăn của tiệc cưới.",
          taskNote: "Làm việc với nhà hàng để chốt thực đơn.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chốt số lượng bàn tiệc.",
          taskNote: "Báo số lượng bàn chính thức và dự phòng cho nhà hàng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn tất hợp đồng với ban nhạc, ca sĩ.",
          taskNote: "Ký hợp đồng và thống nhất các điều khoản.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lựa chọn và đặt quà lưu niệm cho khách mời.",
          taskNote: "Chọn món quà ý nghĩa và phù hợp ngân sách.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase5Start.toISOString(),
      phaseTimeEnd: phase5End.toISOString(),
      tasks: [
        {
          taskName: "Nhờ bạn bè hoặc người thân làm phù dâu, phù rể (hoặc tìm hiểu dịch vụ thuê).",
          taskNote: "Ngỏ lời và bàn bạc về vai trò, trang phục.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Soạn playlist nhạc cho hôn lễ.",
          taskNote: "Chọn nhạc cho lúc đón khách, làm lễ, dùng tiệc.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn thiện timeline chi tiết của ngày cưới.",
          taskNote: "Lên lịch trình từng giờ cho ngày trọng đại.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Làm việc với MC để thống nhất nội dung chương trình.",
          taskNote: "Trao đổi về kịch bản, các nghi thức và trò chơi.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn tất thủ tục đăng ký kết hôn.",
          taskNote: "Chuẩn bị giấy tờ và đến cơ quan hành chính để đăng ký.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Đặt phương tiện di chuyển cho gia đình, bạn bè (nếu cần).",
          taskNote: "Thuê xe nếu gia đình và khách ở xa.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chọn trang phục ngày cưới cho gia đình.",
          taskNote: "Hỗ trợ bố mẹ, anh chị em chọn trang phục phù hợp.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chốt trang phục cho phù dâu, phù rể.",
          taskNote: "Thống nhất kiểu dáng, màu sắc và đặt may/thuê.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase6Start.toISOString(),
      phaseTimeEnd: phase6End.toISOString(),
      tasks: [
        {
          taskName: "Viết và gửi thiệp mời.",
          taskNote: "Gửi thiệp đến khách mời.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn thiện toàn bộ trang phục của cô dâu, chú rể.",
          taskNote: "Thử lại lần cuối, chỉnh sửa nếu cần.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chuẩn bị trang phục cho gia đình và dàn phụ dâu, phụ rể.",
          taskNote: "Đảm bảo mọi người đã có trang phục sẵn sàng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Nhờ người thân hoặc bạn bè viết bài phát biểu, lời chúc.",
          taskNote: "Trao đổi với người sẽ phát biểu trong tiệc.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Gửi timeline chương trình cho gia đình, phụ dâu, phụ rể.",
          taskNote: "Để mọi người nắm rõ lịch trình và hỗ trợ.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Sắp xếp sơ đồ chỗ ngồi khách mời.",
          taskNote: "Lên sơ đồ để tiện cho việc đón khách.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Phân công người quản lý thùng tiền mừng.",
          taskNote: "Chọn người tin cậy để phụ trách việc này.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Nhờ em/chị (bạn thân) xách vali hoặc đồ dùng cho cô dâu.",
          taskNote: "Chuẩn bị người hỗ trợ cô dâu trong ngày cưới.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Kiểm tra lại flow chương trình với điều phối hoặc người thân hỗ trợ.",
          taskNote: "Đảm bảo mọi người hiểu rõ vai trò của mình.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chuẩn bị quà hoặc lời cảm ơn riêng cho bố mẹ, họ hàng thân thiết.",
          taskNote: "Thể hiện lòng biết ơn đến những người đã hỗ trợ.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase7Start.toISOString(),
      phaseTimeEnd: phase7End.toISOString(),
      tasks: [
        {
          taskName: "Viết vows (lời thề hôn nhân).",
          taskNote: "Chuẩn bị những lời yêu thương để trao cho nhau.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Kiểm tra toàn bộ ấn phẩm cưới (thiệp, bảng tên, menu…).",
          taskNote: "Kiểm tra lại bảng tên, menu, backdrop...",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Liên hệ nhắc lại với các nhà cung cấp dịch vụ.",
          taskNote: "Gọi điện xác nhận lại thời gian, địa điểm.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Đi làm tóc và chăm sóc da, móng.",
          taskNote: "Chăm sóc bản thân để rạng rỡ nhất.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chuẩn bị sẵn túi vật dụng khẩn cấp: kem chống nắng, xịt khoáng, nước hoa, chỉ kim, băng keo cá nhân…",
          taskNote: "Chuẩn bị kim chỉ, băng cá nhân, thuốc men cần thiết...",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase8Start.toISOString(),
      phaseTimeEnd: phase8End.toISOString(),
      tasks: [
        {
          taskName: "Nhận trang phục chính thức.",
          taskNote: "Nhận và kiểm tra lại lần cuối tất cả trang phục.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Kiểm tra lần cuối toàn bộ hạng mục cưới.",
          taskNote: "Rà soát lại checklist để đảm bảo không bỏ sót.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Soát checklist toàn bộ đồ cần mang theo.",
          taskNote: "Đảm bảo không quên những vật dụng quan trọng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Luyện tập vows.",
          taskNote: "Tập đọc để tự tin và truyền cảm hơn.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Cô dâu – chú rể nghỉ ngơi, spa, chăm sóc tóc và da để sẵn sàng cho ngày trọng đại.",
          taskNote: "Thư giãn để có tinh thần và sức khỏe tốt nhất.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase9Start.toISOString(),
      phaseTimeEnd: phase9End.toISOString(),
      tasks: [
        {
          taskName: "Ăn uống lành mạnh, uống nhiều nước.",
          taskNote: "Giữ gìn sức khỏe, tránh ăn đồ lạ.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Soạn sẵn vali/túi đồ dùng cần thiết cho ngày mai.",
          taskNote: "Để sẵn ở nơi dễ thấy.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Treo sẵn trang phục.",
          taskNote: "Ủi phẳng và treo sẵn trang phục cho ngày cưới.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Dưỡng da đầy đủ.",
          taskNote: "Chăm sóc da để có lớp nền trang điểm đẹp.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Đi ngủ sớm để giữ sức khỏe.",
          taskNote: "Ngủ đủ giấc để có tinh thần sảng khoái.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase10Start.toISOString(),
      phaseTimeEnd: phase10End.toISOString(),
      tasks: [
        {
          taskName: "Ăn sáng no và đủ chất.",
          taskNote: "Nạp năng lượng cho một ngày dài.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Uống đủ nước để giữ sức.",
          taskNote: "Giữ cho cơ thể không bị mất nước.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
    {
      phaseTimeStart: phase11Start.toISOString(),
      phaseTimeEnd: phase11End.toISOString(),
      tasks: [
        {
          taskName: "Liên hệ với ekip để nhận ảnh, video chính thức.",
          taskNote: "Thống nhất thời gian nhận sản phẩm.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chọn lọc ảnh để in album, làm photobook hoặc khung ảnh.",
          taskNote: "Chọn những tấm ảnh đẹp nhất để lưu giữ.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Lưu trữ file ảnh, video ra nhiều nơi (ổ cứng, drive, USB) để tránh mất dữ liệu.",
          taskNote: "Sao lưu dữ liệu quan trọng ở nhiều nơi.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Chia sẻ album online cho khách mời (nếu muốn).",
          taskNote: "Tạo album trực tuyến để chia sẻ với mọi người.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tổng kết chi phí cưới: thu – chi, đối chiếu lại ngân sách.",
          taskNote: "Hoàn tất các khoản thanh toán và tổng kết lại.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Cảm ơn và trả thù lao (nếu chưa) cho MC, ban nhạc, ekip, bạn bè đã hỗ trợ.",
          taskNote: "Gửi lời cảm ơn chân thành đến mọi người.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Sắp xếp và gửi lời cảm ơn đến khách đã mừng.",
          taskNote: "Thể hiện sự trân trọng đối với khách mời.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Gửi trả váy cưới, suit, phụ kiện (nếu thuê).",
          taskNote: "Hoàn tất việc trả đồ đã thuê.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Bảo quản váy cưới, áo dài, vest (nếu giữ lại).",
          taskNote: "Bảo quản kỹ để làm kỷ niệm.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Kiểm kê đồ dùng lễ cưới còn dư: thiệp, quà khách, phụ kiện decor.",
          taskNote: "Sắp xếp và tái sử dụng những gì còn lại.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Gửi thiệp/cảm ơn online đến khách (có thể kèm vài tấm ảnh).",
          taskNote: "Gửi lời cảm ơn kèm ảnh đẹp.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tặng quà hoặc lời cảm ơn riêng đến bố mẹ, họ hàng thân thiết, bạn bè đã giúp đỡ.",
          taskNote: "Thể hiện lòng biết ơn đặc biệt.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn tất thủ tục liên quan đến đăng ký kết hôn (nếu chưa xong).",
          taskNote: "Nếu có giấy tờ gì còn dang dở.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Cập nhật thông tin hôn nhân trên giấy tờ cá nhân (hộ khẩu, ngân hàng, bảo hiểm).",
          taskNote: "Cập nhật thông tin trên các giấy tờ quan trọng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Sắp xếp, dọn dẹp lại đồ dùng sau cưới.",
          taskNote: "Tổ chức lại không gian sống.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Hoàn thiện phòng tân hôn hoặc nhà mới (nếu chưa kịp trước cưới).",
          taskNote: "Sắp xếp không gian sống chung.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Tạo thói quen sinh hoạt và chi tiêu chung.",
          taskNote: "Xây dựng lối sống chung.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Dành thời gian nghỉ ngơi, du lịch ngắn hoặc tuần trăng mật (nếu chưa đi).",
          taskNote: "Tận hưởng khoảng thời gian đầu tiên của cuộc sống vợ chồng.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Dành thời gian riêng để chia sẻ, nhìn lại ngày trọng đại cùng nhau.",
          taskNote: "Tạo kỷ niệm đẹp và chia sẻ cảm xúc.",
          member: [creatorId],
          completed: false,
        },
        {
          taskName: "Bắt đầu lên kế hoạch tài chính, mục tiêu chung (mua nhà, kế hoạch con cái, tiết kiệm…).",
          taskNote: "Lập kế hoạch tương lai cho gia đình.",
          member: [creatorId],
          completed: false,
        },
      ],
    },
  ];
};

export const budgetListData = () => [
  {
    groupName: "Trang sức & Nhẫn cưới",
    activities: [
      {
        activityName: "Nhẫn đính hôn",
        activityNote: "Chọn và mua nhẫn đính hôn.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Nhẫn cưới",
        activityNote: "Chọn và mua nhẫn cưới cho cả hai.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName:
          "Trang sức cô dâu (dây chuyền, vòng tay, bông tai, kiềng cưới)",
        activityNote: "Mua hoặc thuê trang sức cho cô dâu.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Quà cưới bố mẹ hai bên (nếu có)",
        activityNote: "Chuẩn bị quà tặng cho bố mẹ.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Ảnh & Video",
    activities: [
      {
        activityName:
          "Chụp ảnh pre-wedding (trong studio / ngoại cảnh / du lịch)",
        activityNote: "Lên ý tưởng và thực hiện bộ ảnh cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Album, photobook, ảnh phóng to để bàn",
        activityNote: "In ấn các sản phẩm từ ảnh pre-wedding.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Quay – chụp lễ ăn hỏi",
        activityNote: "Thuê ekip quay phim, chụp ảnh cho lễ ăn hỏi.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName:
          "Quay – chụp lễ cưới (full ngày, highlight, clip phóng sự)",
        activityNote: "Thuê ekip quay phim, chụp ảnh cho ngày cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Flycam (nếu cần)",
        activityNote: "Thuê flycam để có những cảnh quay từ trên cao.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Trang phục – Make up",
    activities: [
      {
        activityName: "Váy cưới (làm lễ, đi tiệc, dạ hội)",
        activityNote: "Thuê hoặc may váy cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Vest cưới (1–2 bộ, vest phụ rể)",
        activityNote: "Thuê hoặc may vest cho chú rể.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Áo dài / trang phục truyền thống (ăn hỏi, đón dâu)",
        activityNote: "Chuẩn bị áo dài cho các nghi lễ.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Trang phục phụ dâu – phụ rể",
        activityNote: "Chọn và chuẩn bị trang phục cho đội hình phụ.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Trang phục bố mẹ hai bên",
        activityNote: "Chuẩn bị trang phục cho bố mẹ.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Make up & làm tóc cô dâu (ăn hỏi + ngày cưới)",
        activityNote: "Đặt lịch với chuyên gia trang điểm.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Make up người nhà (mẹ, chị em, phụ dâu)",
        activityNote: "Đặt thêm gói trang điểm cho người thân.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Thuê/đặt giày cưới, phụ kiện tóc, khăn voan",
        activityNote: "Hoàn thiện vẻ ngoài cho cô dâu.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Lễ ăn hỏi / Đám ngõ",
    activities: [
      {
        activityName: "Lễ vật",
        activityNote:
          "Trầu cau, chè, rượu, bánh, hoa quả, lợn quay/gà trống, xôi, mâm quả theo phong tục.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "groom",
      },
      {
        activityName: "Lễ đen",
        activityNote: "Tiền dẫn cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "groom",
      },
      {
        activityName: "Đội bưng quả (bao lì xì + thuê trang phục)",
        activityNote: "Chuẩn bị cho đội bưng quả hai nhà.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Xe đưa đón họ hàng",
        activityNote: "Thuê xe cho nhà trai đi ăn hỏi.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "groom",
      },
      {
        activityName: "Tiệc chiêu đãi",
        activityNote: "Tiệc mặn hoặc ngọt tại nhà gái sau lễ ăn hỏi.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "bride",
      },
      {
        activityName: "Trang trí",
        activityNote:
          "Phông, cổng hoa, bàn ghế, backdrop, hoa tươi cho lễ ăn hỏi.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Lễ cưới",
    activities: [
      {
        activityName:
          "Hoa cưới (hoa cầm tay, hoa cài áo, hoa xe cưới, hoa bàn tiệc)",
        activityNote: "Đặt hoa tươi cho ngày cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Xe hoa/ xe đưa dâu",
        activityNote: "Thuê và trang trí xe đưa dâu.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "groom",
      },
      {
        activityName: "Trang trí nhà gái",
        activityNote: "Trang trí phòng tân hôn, bàn thờ gia tiên, cổng hoa.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "bride",
      },
      {
        activityName: "Trang trí nhà trai",
        activityNote: "Trang trí cổng hoa, bàn tiệc, phông cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "groom",
      },
      {
        activityName: "MC – ban nhạc – ca sĩ (nếu thuê riêng)",
        activityNote: "Thuê để chương trình thêm phần sôi động.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Tiệc cưới",
    activities: [
      {
        activityName: "Đặt tiệc (theo bàn)",
        activityNote: "Chi phí cho các mâm cỗ đãi khách.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Đồ uống: bia, nước ngọt, rượu vang, nước lọc",
        activityNote: "Chi phí đồ uống phát sinh ngoài thực đơn.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Bánh cưới",
        activityNote: "Đặt bánh cưới theo chủ đề.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "MC & ban nhạc (nếu nằm trong gói)",
        activityNote: "Chi phí đã bao gồm trong gói của nhà hàng.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Sân khấu, âm thanh, ánh sáng",
        activityNote: "Chi phí cho hệ thống âm thanh, ánh sáng.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Trang trí không gian",
        activityNote: "Backdrop chụp ảnh, hoa tươi bàn tiệc, photo booth.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Quà tặng khách mời",
        activityNote: "Thank you gift, kẹo/khăn/ly kỷ niệm.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Nhân viên phục vụ, phí phát sinh",
        activityNote: "Các chi phí dịch vụ khác.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Hậu cần & Khác",
    activities: [
      {
        activityName: "Thiệp cưới (in + giao tận tay)",
        activityNote: "Chi phí thiết kế và in ấn thiệp.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Bao lì xì",
        activityNote: "Lì xì cho người hỗ trợ, nhóm bạn, trẻ con.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Phòng nghỉ khách sạn",
        activityNote: "Phòng cho cô dâu chú rể hoặc khách từ xa.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Chi phí di chuyển",
        activityNote: "Taxi, xe đưa đón họ hàng.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName:
          "Phí dịch vụ cưới trọn gói (planner, wedding organizer nếu thuê)",
        activityNote: "Chi phí cho người lên kế hoạch cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Tiền tip cho ekip",
        activityNote: "Tip cho nhiếp ảnh, trang điểm, âm thanh ánh sáng…",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Chi phí in ấn khác (standee, banner, menu)",
        activityNote: "Các chi phí in ấn khác cho tiệc cưới.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
  {
    groupName: "Dự phòng & Sau cưới",
    activities: [
      {
        activityName: "Tuần trăng mật",
        activityNote: "Vé máy bay, khách sạn, chi phí ăn chơi.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Cảm ơn ekip, bạn bè",
        activityNote: "Mua quà, gửi thiệp cảm ơn.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "In album kỷ niệm cho bố mẹ hai bên",
        activityNote: "In thêm album để tặng gia đình.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
      {
        activityName: "Phát sinh ngoài kế hoạch",
        activityNote: "10–15% tổng ngân sách để dự phòng.",
        expectedBudget: 0,
        actualBudget: 0,
        payer: "both",
      },
    ],
  },
];
