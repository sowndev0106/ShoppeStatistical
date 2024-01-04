let coin_earn = 0;
let si = 8;
let time = {};
const timeSleep = 1000; //1
const limit = 20; //20
const maximumLoop = 1000; //1000

async function getOrders() {
  updateStatusSyncData([], "SYNCING");
  const allOrder = [];
  let loop = 0;
  let offset = 0;

  try {
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
      const ordersClean = orders.filter((order) => order != null);

      allOrder.push(...ordersClean);

      updateStatusSyncData(allOrder, "SYNCING");

      offset += limit;
      loop++;
      await sleep(timeSleep);
    }
  } catch (error) {
    console.log(error);

    updateStatusSyncData(allOrder, "ERROR");
  }

  updateStatusSyncData(allOrder, "DONE");

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
          shopId: parcel?.shop?.shopId,
          orderId: orderId,
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
async function updateStatusSyncData(orders, status) {
  // localStorage.setItem("statistic-shopee-orders", JSON.stringify(orders));
  // localStorage.setItem("statistic-shopee-status-sync", status);
  // localStorage.setItem("statistic-shopee-time", new Date());

  chrome.storage.local.set({
    orders: orders,
    status: status,
    time: new Date().toLocaleString(),
  });
}

async function asyncData() {
  const lastTimeSync = new Date((await chrome.storage.local.get("time")).time);

  // check lastTimeSync is Invalid Date
  console.log("Last sync data " + lastTimeSync?.toLocaleString());
  const timeSync = 1000 * 60 * 60; // 1h
  if (
    isNaN(lastTimeSync?.getTime()) ||
    new Date() - new Date(lastTimeSync) > timeSync
  ) {
    console.log("------------------------------------------- Get order ");

    await getOrders();
  }

  console.log(
    "------------------------------------------- Get order DONE " +
      chrome.runtime.id
  );
}

asyncData();
// "label_preparing_order"
// "label_order_completed"
// "label_on_the_way"
