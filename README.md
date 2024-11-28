# [Bless network bot](https://bless.network/dashboard?ref=8SV9Y7)

<a href="https://bless.network/dashboard?ref=8SV9Y7" target="_blank">
  <img alt="image" src="https://lh3.googleusercontent.com/b7g2cjoW_d3z1xsZ9ENlRmbmeiQbBfHXg3vMKAZMtm0GzUkzsyDE1Y_SliyFhFR-iNRPiKsQLYi0ynWxrKMA14vi=s1280-w1280-h800">
</a>

Auto ping bot for [bless-network](https://bless.network/dashboard?ref=8SV9Y7), with multi accounts and multi proxies support.

[https://bless.network](https://bless.network/dashboard?ref=8SV9Y7)

[手把手中文使用教程]() | [TG Channel](https://t.me/+ntyApQYvrBowZTc1)

## Features

- Multi accounts support.
- Multi proxies support.
- Auto ping every 6 minutes.
- Parallel ping with multi accounts and multi proxies.
- Auto retry when the connection is lost.

## Usage

The `bless-network-bot` can be run using Docker or manually.

### Get your user ID

you can obtain your user ID from the bless-network website:

- Visit [https://bless.network/](https://bless.network/dashboard?ref=8SV9Y7)
- Open the browser's developer tools (usually by pressing F12 or right-clicking and selecting "Inspect").
- Go to the "Console" tab.
- Paste the following command and press Enter:

```javascript
copy(localStorage.getItem('B7S_AUTH_TOKEN'));
```

- Copy the value returned, which is your user ID.

> Note: it looks like `eyJh...`

### Prepare proxies

You can buy proxies from [ProxyCheap](https://app.proxy-cheap.com/r/ksvW8Z) or any other proxy provider.

> Note: You can use HTTP or SOCKS5 proxies, and you can config with multiple proxies in the `proxies.txt` file (one proxy per line).

### Create config files

1. Open the config generator page: <https://web3bothub.github.io/bless-network-bot/nodes-generator.html>
1. Paste your user ID and input your proxies.
1. Click the "Generate" button.
1. Download the generated config files.

> [!WARNING]
> Dont update the config files manually, always use the config generator page to update the config files.

### Running the Bot with Docker (Recommended)

1. put your `nodes.txt` file in current directory.
1. run the `bless-network-bot` using Docker:

```bash
# Linux
docker run -d -v $(pwd)/nodes.txt:/app/nodes.txt overtrue/bless-network-bot

# Windows
docker run -d -v %cd%/nodes.txt:/app/nodes.txt overtrue/bless-network-bot
```

### Check running stats

```bash
# get containerid
docker ps

# show logs of containerid
docker logs -f <containerid>
```

### Manual Installation

> [!WARNING]
> You need to have Node.js installed on your machine to run the bot manually.
> You will have to solve various problems brought by this mode on your own,
> because I don't have time to answer and handle the problems for you.

1. Git clone this repository to your local machine.

```bash
git clone git@github.com:web3bothub/bless-network-bot.git
```

1. Navigate to the project directory.

```bash
cd bless-network-bot
```

1. put your `nodes.txt` file in the project directory.

1. Run the `bless-network-bot` by executing the following command:

```bash
npm run start
```

1. If you want to run the bot in the background, you can use the `pm2` package:

```bash
npm install -g pm2
pm2 start app.js
```

## Note

- It is not recommended to run this script manually unless you are very familiar with Node.js and can solve various environmental problems.
- Run this bot, I don't guarantee you will get the reward, it depends on the bless network website.
- You can just run this bot at your own risk, I'm not responsible for any loss or damage caused by this bot. This bot is for educational purposes only.
- If you have any questions, you can ask in the [Telegram group](https://t.me/+ntyApQYvrBowZTc1).

## Contribution

Feel free to contribute to this project by creating a pull request.

## Support Me

if you want to support me, you can donate to my address:

- TRC20: `TMwJhT5iCsQAfmRRKmAfasAXRaUhPWTSCE`
- ERC20: `0xa2f5b8d9689d20d452c5340745a9a2c0104c40de`
- SOLANA: `HCbbrqD9Xvfqx7nWjNPaejYDtXFp4iY8PT7F4i8PpE5K`
- TON: `UQBD-ms1jA9cmoo8O39BXI6jqh8zwRSoBMUAl4yjEPKD6ata`
