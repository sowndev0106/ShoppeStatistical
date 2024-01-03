let tongDonHang = 0;
let tongTienDuocGiamMggShopee = 0;
let tongTienDuocGiamMggShopeeShop = 0;
let tongTienChiTieu = 0;
let tongTienTietKiem = 0;
let tongTienHang = 0;
let tongTienVanChuyenChuaGiam = 0;
let tongTienVanChuyenDuocGiam = 0;
let tongSanPhamDaMua = 0;
let trangThaiDonHangConKhong = true;
let coin_earn = 0;
let si = 8;
let tongTienVanChuyenPhaiTra = 0;
let time = {};
let offset = 0;
const timeSleep = 1000; //1
const limit = 20; //20
const maximumLoop = 1000; //1000

async function getOrders() {
  const allOrder = [];
  let loop = 0;
  while (loop < maximumLoop) {
    let url = `https://shopee.vn/api/v4/order/get_all_order_and_checkout_list?limit=${limit}&offset=${offset}`;
    let response = await fetch(url);
    let data = await response.json();
    if (!data?.data?.order_data?.details_list?.length) {
      break;
    }
    const orders = await Promise.all(
      data?.data?.order_data?.details_list.map(async (order) =>
        getOrderDetail(order.info_card.order_id)
      )
    );

    allOrder.push(...orders.filter((order) => order != null));

    offset += limit;
    loop++;
    await sleep(timeSleep);
  }
  alert("Đã lấy đủ dữ liệu");
  // console.log({ allOrder: allOrder.sort((a, b) => a - b) })

  return allOrder;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getOrderDetail(orderId) {
  console.log("Get order Id" + orderId);
  let url = `https://shopee.vn/api/v4/order/get_order_detail?order_id=${orderId}`;
  let response = await fetch(url);
  let { data } = await response.json();
  if (!data) return null;
  const order = {};
  order.order_id = orderId;
  order.status = data?.status?.status_label?.text;
  order.shipping = data.shipping?.fulfilment_carrier?.text;
  order.parcel = data.info_card?.parcel_cards?.map((parcel) => {
    return {
      shop: {
        shopId: parcel?.shop_info?.shop_id,
        shopName: parcel?.shop_info?.shop_name,
        username: parcel?.shop_info?.username,
      },
      itemsGroup: parcel?.product_info?.item_groups?.map(
        ({ items, num_items }) => {
          return {
            num_items,
            items: items?.map((item) => {
              return {
                itemId: item?.item_id,
                model_id: item?.model_id,
                name: item?.name,
                model_name: item?.model_name,
                image: item?.image,
                amount: item?.amount,
                item_price: item?.item_price,
                price_before_discount: item?.price_before_discount,
                order_price: item?.order_price,
              };
            }),
          };
        }
      ),
      countItem: parcel.product_info?.total_num_items,
      payment_info: {
        currency: parcel?.payment_info.currency,
        total_price: parcel?.payment_info.total_price,
        merchandise_subtotal: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_merchandise_subtotal"
        ),
        shipping: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_shipping"
        ),
        shipping_discount_subtotal: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_shipping_discount_subtotal"
        ),
        shopee_voucher_applied: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_shopee_voucher_applied"
        ),
        redeemed_number_coins: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_redeemed_number_coins"
        ),
        shop_voucher_applied: getValueFromInfoRowsByLable(
          parcel?.payment_info.info_rows,
          "label_odp_shop_voucher_applied"
        ),
      },
    };
  });
  order.items = [];
  order.parcel?.forEach((parcel) => {
    parcel.itemsGroup.forEach((group) => {
      group.items.forEach((item) => {
        order.items.push({
          itemId: item?.itemId,
          model_id: item?.model_id,
          name: item?.name,
          model_name: item?.model_name,
          image: item?.image,
          amount: item?.amount,
          item_price: item?.item_price,
          price_before_discount: item?.price_before_discount,
          order_price: item?.order_price,
        });
      });
    });
  });

  order.subtotal = data.info_card.subtotal;
  order.final_total = data.info_card.final_total;
  order.payment_method = {
    payment_method: data.payment_method?.payment_method,
    payment_channel_name: data.payment_method?.payment_channel_name?.text,
  };
  order.processing_info = {
    order_time: convertTime(
      getValueFromInfoRowsByLable(
        data?.processing_info.info_rows,
        "label_odp_order_time"
      )
    ).toLocaleString(),
    payment_time: convertTime(
      getValueFromInfoRowsByLable(
        data?.processing_info.info_rows,
        "label_odp_payment_time"
      )
    ).toLocaleString(),
    ship_time: convertTime(
      getValueFromInfoRowsByLable(
        data?.processing_info.info_rows,
        "label_odp_ship_time"
      )
    ).toLocaleString(),
    completed_time: convertTime(
      getValueFromInfoRowsByLable(
        data?.processing_info.info_rows,
        "label_odp_completed_time"
      )
    ).toLocaleString(),
  };
  return order;
}

function convertTime(number) {
  return new Date(number * 1000);
}
function getValueFromInfoRowsByLable(info_rows, lable) {
  return Number(
    info_rows.find((row) => row.info_label.text == lable)?.info_value.value
  );
}

async function asyncData() {
  const allOrder = await getOrders();
  console.log(allOrder);
  localStorage.setItem("allOrder", JSON.stringify(allOrder));

  chrome.storage.local.set({
    allOrder: allOrder,
  });
}

asyncData();
// "label_preparing_order"
// "label_order_completed"
// "label_on_the_way"
