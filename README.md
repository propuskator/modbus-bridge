# Propuskator
## Запуск бриджа через ноду
1) Переходим в `bridges/modbus` в ветку `АС-393-modbus-bridge`
2) Копируем пример енв файла: `cp .env.defaults.sample .env.defaults`
3) Конфигурируем его под себя (ниже будет соответствие полей)
4) Запускаем через `node index.js`


## Запуск бриджа через докер композер
1) Переходим в `bridges/modbus` в ветку `АС-393-modbus-bridge`
2) Билдим модбас бридж `gitlab.iot.webbylab.com:5050/2smart/propuskator/bridges/modbus:{TAG}`
3) Переходим в папку `composer` и конфигурируем `.env_modbus` (ниже будет соответствие полей)
4) Запускаем бридж командой `docker-compose -f docker-compose.modbus.yml up -d` (берет переменные с `.env_modbus`)

# Поля конфига

`SLAVE_IDS` - slaveId точек доступа на прошивке (1 или 1-3 или 1;2;5-10;15)

`BRIDGE_ID` - id т.д. которое отображается в ui

`TOKEN` - api token из api settings в пропускаторе

`SERVICE_TOKEN` - сервис токен из .env (там название 'MODBUS_SERVICE_TOKEN')

`WORKSPACE_NAME` - имя воркспейса пропускатора

`WORKSPACE_LOGIN` - логин

`MODBUS_DRIVER_TYPE` - тип конекта с соской (tcp или serial)

`MODBUS_DRIVER_TCP_PORT` - порт соски
`MODBUS_DRIVER_TCP_HOST` - ip соски

`MODBUS_BAUD_RATE` - бауд рейт (9600 или 19200, зависит от прошивки)

`MODBUS_DATA_BITS` (default: 8)

`MODBUS_STOP_BITS` (default: 1)

`MODBUS_PARITY` (default: none)

`MODBUS_DRIVER_SERIAL_PORT` - usb порт на котором сидит соска (если соединение serial)

`MODBUS_TRANSPORT_TYPE` (неизменно, defaul: serial)

`MODBUS_TRANSPORT_DRAIN_TIMEOUT_MS` время ожидания следующего подпакета (при приеме больших пакетов) (default: 300)

`MODBUS_TRANSPORT_REQUEST_TIMEOUT_MS` - время ожидания ответа от т.д. (таймаут, default: 2000)

`MODBUS_TRANSPORT_GET_LOGS_TIMEOUT_MS` - время таймаута для считывания логов из т.д. (занимает больше времени, т.к. большие пакеты) (default: 10000)

## logger.config
`VERBOSE`=verbose - (если не нужно получать все логи коментируем и будут приходить только warn и error)

`LOG_FORMAT`=plain

## rest-api.config
`API_URL`=http://access-backend:8000 - url бекенда


## GENERAL CONSTANTS
`MILLISECONDS_IN_SECOND`=1000

`MILLISECONDS_IN_MINUTES`=60000

## READER CONSTANTS
`UPDATE_TIME_INTERVAL`=300000 - интервал раз в сколько милисекунд будет обновление времени на т.д.

`UPDATE_SYNC_INTERVAL`=60000 - интервал обновления правил

`UPDATE_LOGS_INTERVAL`=61000 - интервал проверки логов

`UPDATE_POLL_INTERVAL`=200 - интервал опроса транспорта в mqtt

`SYNC_STATUSES_INTERVAL`=30000 - интервал проверки статусов (данные о наличии логов, последних синков времени и правил)

`SYNC_OPTIONS_INTERVAL`=15000 - интервал проверки опшинов (данные о состоянии двери, к1, к2 и т.д.)

`SYNC_RULES_MAX_BYTES`=4096 - ограничение в байтах одного пакета (для отправки правил)

## MODBUS CONSTANTS
`MODBUS_RESET_CONN_INTVL` - интервал с которым пересоздается tcp соединение(для проверки если коннект пропал и не вернулся)

`MODBUS_RETRY_CONN_INTVL` - интервал реконекта к соске, если нету конекшина

`MODBUS_RETRY_INIT_INTVL` - интервал пересоздания коннекта к соске (если не создался при запуске)

`MODBUS_CALL_RETRIES` - количество повторных запросов после неудачи которых ридер переводится в оффлайн режим и пытается сделать реконект пока не законектится

`MODBUS_RETRY_REQUEST_INTERVAL` - интервал пересоздания каждой т.д. (если не создалась при запуске или отпала)

`MODBUS_REQUEST_TIMEOUT` - время ожидания ответа от т.д.

## API CONSTANTS
`REST_API_RETRY_INTERVAL` - время ожидания ответа от сервера
