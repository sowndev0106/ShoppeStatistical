var tongDonHang = 0;
var tongTienDuocGiamMggShopee = 0;
var tongTienDuocGiamMggShopeeShop = 0;
var tongTienChiTieu = 0;
var tongTienTietKiem = 0;
var tongTienHang = 0;
var tongTienVanChuyenChuaGiam = 0;
var tongTienVanChuyenDuocGiam = 0;
var tongSanPhamDaMua = 0;
var trangThaiDonHangConKhong = true;
var coin_earn = 0;
var offset = 0;
var si = 8;
var tongTienVanChuyenPhaiTra = 0;
var time = {}
function xemBaoCaoThongKe() {
    var orders = [];
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            orders = JSON.parse(this.responseText)['orders'];
            tongDonHang += orders.length;
            trangThaiDonHangConKhong = orders.length >= si;
            orders.forEach(order => {

                let cancelled_time = order.time.cancelled_time
                let completed_time = order.time.completed_time
                let create_time = order.time.create_time
                // console.log({
                //     'cencel': cancelled_time == 0 ? 0 : toDateTime(create_time),
                //     'Completed': completed_time == 0 ? 0 : toDateTime(completed_time), 'Create': create_time == 0 ? 0 : toDateTime(create_time)
                // })
                // console.log('----------------------------------------------------------------')


                let t3 = order["shipping_discount_subtotal"] / 100000;
                tongTienVanChuyenDuocGiam += t3;
                let t31 = order["shipping_subtotal_before_discount"] / 100000;
                tongTienVanChuyenChuaGiam += t31;
                let t4 = order["merchandise_subtotal"] / 100000;
                tongTienHang += t4;
                let t41 = order["actual_price"] / 100000;
                tongTienChiTieu += t41;
                let t2 = order["shipping_fee"] / 100000;
                tongTienVanChuyenPhaiTra += t2;
                let tongSanPhamTrongOrder = 0;
                order["items"].forEach(item => {
                    let t5 = item["amount"];
                    tongSanPhamTrongOrder += t5;
                    tongSanPhamDaMua += t5;
                });
                let t6 = (order["payment_info"]["voucher_info"]["discount_by_shop_voucher"] || 0) / 100000;
                tongTienDuocGiamMggShopeeShop += t6;
                let t61 = (order["payment_info"]["promotion_info"]["used_price"] || 0) / 100000;
                tongTienDuocGiamMggShopeeShop += t61;

                let t7 = (order["payment_info"]["voucher_info"]["discount_by_shopee_voucher"] || 0) / 100000;
                tongTienDuocGiamMggShopee += t7;
                let t8 = (order["payment_info"]["coin_info"]["coin_earn_by_shopee_voucher"] || 0);
                coin_earn += t8;

                // order with time
                create_time = toDateTime(create_time);
                let year = create_time.getFullYear();
                let month = create_time.getMonth();
                if (time[year] == undefined) {
                    time[year] = { money: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], stuff: {} };
                }
                time[year].money[month] += t41;

                if (!time[year].stuff[month]) {
                    time[year].stuff[month] = { billQuantity: 0, productQuantity: 0, payableTotal: 0, shippingFeeTotal: 0, saveTotal: 0 };
                }
                time[year].stuff[month].billQuantity += 1;
                time[year].stuff[month].productQuantity += tongSanPhamTrongOrder;
                time[year].stuff[month].payableTotal += t41;
                time[year].stuff[month].shippingFeeTotal += t2;
                time[year].stuff[month].saveTotal += (t6 + t61 + t7);
                const products =
                    order["items"].map(item => {
                        return {
                            amount: item.amount,
                            image: item.image_list == null ? '' : item.image_list[0],
                            price: item.order_price / 100000,
                            name: item.name,
                            orderId: item.orderid,
                            shopId: item.shopid,
                            itemId: item.itemid,
                            model: item.model_name
                        }
                    });

                // amount: item.amount,
                // image: item.image_list == null ? '' : item.image_list[0],
                // price: item.order_price / 100000,
                // name: item.name


                if (!time[year].stuff[month].products) {
                    time[year].stuff[month].products = products;
                } else {
                    time[year].stuff[month].products = [...time[year].stuff[month].products, ...products];
                    // time[year].stuff[month].product.push(item)
                }
                // console.log('Month: ' + month + ' Length' + time[year].stuff[month].products.length);
            });
            offset += si;
            if (trangThaiDonHangConKhong) {
                console.log('Đã thống kê được: ' + tongDonHang + ' đơn hàng. Đang lấy thêm dữ liệu....');
                xemBaoCaoThongKe();
            }
            else {
                // get data done !
                // add summary for time
                for (let key in time) {
                    if (time.hasOwnProperty(key)) {
                        let billQuantity = 0, productQuantity = 0, payableTotal = 0, shippingFeeTotal = 0, saveTotal = 0;
                        for (let keyStuff in time[key].stuff) {
                            // console.log(stuff)
                            billQuantity += time[key].stuff[keyStuff].billQuantity
                            productQuantity += time[key].stuff[keyStuff].productQuantity
                            payableTotal += time[key].stuff[keyStuff].payableTotal
                            shippingFeeTotal += time[key].stuff[keyStuff].shippingFeeTotal
                            saveTotal += time[key].stuff[keyStuff].saveTotal
                            // console.log({ bill, product, total, shippingFee, save })
                        }
                        time[key].summary = { billQuantity, productQuantity, payableTotal, shippingFeeTotal, saveTotal };
                    }
                }
                tongTienHang = tongTienHang - (tongTienDuocGiamMggShopeeShop + tongTienDuocGiamMggShopee);
                tongTienTietKiem = tongTienDuocGiamMggShopee + tongTienDuocGiamMggShopeeShop + tongTienVanChuyenDuocGiam;
                var tongTienChiTieuX = pxgPrice(tongTienChiTieu);
                // console.log("================================");
                // console.log("%c" + PXGCert(tongTienChiTieu), "font-size:26px;");
                // console.log("%cSố tiền bạn ĐÃ ĐỐT vào Shopee là: " + "%c" + tongTienChiTieuX + " vnđ%c", "font-size: 20px;", "font-size: 26px; color:orange;font-weigth:700", "font-size: 20px;");
                // console.log("================================");
                // console.log("%cTổng đơn hàng đã giao: " + "%c" + pxgPrice(tongDonHang) + " đơn hàng", "font-size: 20px;", "font-size: 20px; color:green");
                // console.log("%cTổng sản phẩm đã đặt: " + "%c" + pxgPrice(tongSanPhamDaMua) + " sản phẩm", "font-size: 20px;", "font-size: 20px; color:#fc0000");
                // console.log("%cTổng tiền hàng + phí vận chuyển khi CHƯA SỬ DỤNG các loại voucher: " + "%c" + pxgPrice(tongTienChiTieu + tongTienTietKiem) + " vnđ", "font-size: 24px;", "font-size: 24px; color:orange;font-weigth:700");
                // console.log("%cTổng tiền hàng khi chưa dùng Mã giảm giá: " + "%c" + pxgPrice(tongTienChiTieu + tongTienTietKiem - tongTienVanChuyenChuaGiam) + " vnđ", "font-size: 18px;", "font-size: 18px; color:#fc0000");
                // console.log("%cTổng tiền phí vận chuyển khi chưa dùng mã Freeship: " + "%c" + pxgPrice(tongTienVanChuyenChuaGiam) + " vnđ", "font-size: 18px;", "font-size: 18px; color:#fc0000");
                // console.log("================================");
                // console.log("%cTổng tiền hàng + phí vận chuyển khi ĐÃ SỬ DỤNG các loại voucher: " + "%c" + tongTienChiTieuX + " vnđ%c", "font-size: 24px;", "font-size: 24px; color:orange;font-weigth:700", "font-size: 20px;");
                // console.log("%cTổng tiền phí vận chuyển đã trả: " + "%c" + pxgPrice(tongTienVanChuyenPhaiTra) + " vnđ", "font-size: 20px;", "font-size: 20px; color:#fc0000");
                // console.log("%c(1)Tổng tiền phí vận chuyển tiết kiệm được nhờ áp Mã Freeship: " + "%c" + pxgPrice(tongTienVanChuyenDuocGiam) + " vnđ", "font-size: 18px;", "font-size: 18px; color:green");
                // console.log("%c(2)Tổng tiền TIẾT KIỆM được nhờ áp Mã giảm giá Shopee: " + "%c" + pxgPrice(tongTienDuocGiamMggShopee) + " vnđ", "font-size: 18px;", "font-size: 18px; color:green");
                // console.log("%c(3)Tổng tiền TIẾT KIỆM được nhờ dùng Voucher của Shop: " + "%c" + pxgPrice(tongTienDuocGiamMggShopeeShop) + " vnđ", "font-size: 18px;", "font-size: 18px; color:green");
                // console.log("%c(4)Tổng Xu nhận được nhờ dùng Mã hoàn xu Shopee: " + "%c" + pxgPrice(coin_earn) + " xu", "font-size: 18px;", "font-size: 18px; color:green;font-weigth:700");
                // console.log("%c💰TỔNG TIẾT KIỆM(1+2+3+4): " + "%c" + pxgPrice(tongTienTietKiem + tongTienTietKiem) + " vnđ", "font-size: 24px;", "font-size: 24px; color:orange;font-weigth:700");
                // console.log("================================");
                // console.log("%c👉Lấy Mã giảm giá Shopee mỗi ngày tại đây: " + "%chttps://magiamgiashopee.vn", "font-size: 24px;", "font-size: 24px; color:orange;font-weigth:700");
                // console.log("-==========================")

                showView(tongTienChiTieu, tongDonHang, tongSanPhamDaMua, tongTienVanChuyenPhaiTra, tongTienTietKiem, time)
                console.log("-========================== Done ")
            }
        }
    };
    xhttp.open("GET", "https://shopee.vn/api/v1/orders/?order_type=3&offset=" + offset + "&limit=" + si, true);
    xhttp.send();
}
function PXGCert(pri) {
    if (pri <= 10000000) {
        return "HÊN QUÁ! BẠN CHƯA BỊ SHOPEE GÂY NGHIỆN 😍";
    } else if (pri > 10000000 && pri <= 50000000) {
        return "THÔI XONG! BẠN BẮT ĐẦU NGHIỆN SHOPEE RỒI 😂";
    } else if (pri > 50000000 && pri < 80000000) {
        return "ỐI GIỜI ƠI! BẠN LÀ CON NGHIỆN SHOPEE CHÍNH HIỆU 😱";
    } else {
        return "XÓA APP SHOPEE THÔI! BẠN NGHIỆN SHOPEE NẶNG QUÁ RỒI 😝";
    }
}
function pxgPrice(number, fixed = 0) {
    if (isNaN(number)) return 0;
    number = number.toFixed(fixed);
    let delimeter = ',';
    number += '';
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(number)) {
        number = number.replace(rgx, '$1' + delimeter + '$2');
    }
    return number;
}

xemBaoCaoThongKe();

function showView(payableTotal, billQuantity, productQuantity, shippingFeeTotal, saveTotal, time) {
    localStorage.setItem('payableTotal', payableTotal);
    localStorage.setItem('billQuantity', billQuantity);
    localStorage.setItem('productQuantity', productQuantity);
    localStorage.setItem('shippingFeeTotal', shippingFeeTotal);
    localStorage.setItem('saveTotal', saveTotal);

    var srcImage
    var username
    try {
        username = localStorage.getItem('username')
    } catch (error) {

    }
    try {
        var picture = document.querySelectorAll(".shopee-avatar__img");
        srcImage = picture[0].src;
    } catch (error) {

    }
    if (username) {
        username = username.replace('"', '')
    }

    chrome.storage.local.set({
        'result': {
            'srcImage': srcImage,
            'username': username,
            'payableTotal': payableTotal,
            'billQuantity': billQuantity,
            'productQuantity': productQuantity,
            'shippingFeeTotal': shippingFeeTotal,
            'saveTotal': saveTotal,
            'time': time

        }
    })
    // console.log(time)


}
function toDateTime(secs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
}



// amount: 80
// chatid: 0
// currency: "VND"
// extinfo: {comm_fee: 0, item_tax: 0, service_fee_info: {…}, comm_base_amount: 59200000000, is_one_dollar_game_order: false, …}
// image: "ab573c3010e5139a13812d5aeeadb648"
// image_list: (9) ['ab573c3010e5139a13812d5aeeadb648', '7c63661833c939559564539bb21a67b3', '980afe14f79368987a87bc678976b144', 'de901a588ecbb42e9dce7c9206e32d60', 'cb557d5662f5eabd3d7c72e51435a6c2', '50b6f49e37336b72168df67a0b25e0ee', 'e95c12b94e396a247fdd18eb16ca26c3', '27525089fdefdb5737308a0561eb8c5a', '4e348d9c78f9a86ea49c67e2ffe30d87']
// item_group_id: "0"
// item_price: 740000000
// itemid: 5643311146
// model_name: "xanh ngọc - số 3"
// modelid: 60375343227
// name: "Xốp dán tường giả gạch 3D - Khổ lớn 70x77cm"
// offerid: 0
// order_price: 740000000
// orderid: 75297941373263
// original_price: 740000000
// price_before_discount: 0
// shopid: 170277063
// snapshotid: 2564114812
// status: 2
// userid: 407017953

170277063.5643311146
// name + '-i' + '.'+shopid + itemid