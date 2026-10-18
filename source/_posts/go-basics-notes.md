---
title: Go 入门笔记：8 个我踩过的坑，每个都来自我写的校园失物招领后端
date: 2026-09-29 19:10:00.000
updated: 2026-09-29 19:03:40.965
featured: true
categories:
  - 学习笔记
tags:
  - Go
  - 后端
  - Gin
---
我是数学系大一，社团大作业要做一套校园失物招领系统，我认领了后端。选 Go 的理由很功利：语法少、编译快、交叉编译出一条命令就能扔到服务器上跑，没有虚拟机也没有一堆依赖要装。

仓库第一天的样子是——所有接口、所有数据库操作，全堆在 `main.go` 里。两周后它变成了 `handler / service / repository` 分层的样子。这篇文章不打算复述 Go 的语法大全（那种文章已经太多了），我只写自己真正卡住过的地方，每个点都配上项目里的真实代码。贴之前我把密码和密钥都换成了占位符。

<!-- more -->

## 一、`:=` 和 `var`：短变量声明不是”少打几个字”

`:=` 是**声明并赋值**，不是赋值。所以同一作用域里不能对同一个变量用两次：

```go
a := 1
a := 2   // 编译错误：no new variables on left side of :=
```

真正会咬人的是它在**新作用域**里的行为。`if`、`for`、函数体都会开新作用域，里面的 `:=` 会造一个**同名的新变量**，把外层的遮蔽掉——这个现象叫 variable shadowing：

```go
var err error
if needCheck {
    result, err := doSomething()   // 这里的 err 是新变量，外层那个还是 nil
    _ = result
}
if err != nil {   // 永远进不来
    // ...
}
```

外层 `err` 从头到尾都是 nil，所以后面那个判断形同虚设，错误被静默吞掉。这种 bug 编译器不报错、运行时也不崩，只是行为不对——最难查的一类。我的习惯是：\*\*如果外层已经有 `err` 了，里面就写 `var` 或者用 `=`，别用 `:=`\*\*。

## 二、struct tag：一个字段并排挂三套标签

```go
type LostItem struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Title    string `json:"title" binding:"required,notblank"`
	Location string `json:"location"`
	Desc     string `json:"desc"`
}
```

反引号里那一串可以并排挂好几套 tag，各归各的解析器管：

-   `json:"title"` → 序列化成 JSON 时这个字段叫什么
-   `gorm:"primaryKey"` → 建表时它是不是主键
-   `binding:"required"` → Gin 校验请求体时的规则

初学者最容易晕的是”这行到底是谁在管”。`json:"-"` 是”不出现在 JSON 里”，`gorm:"-"` 是”不存进数据库”，位置写错行为天差地别。

### 一个真实的 bug：空格能大摇大摆绕过 `required`

标题字段最初只写了 `binding:"required"`。队友测试时发现能提交一篇标题全是空格的帖子。

原因：`required` 判断的是”是不是零值”。字符串的零值是 `""`，而 `" "`（一个空格）长度是 1，在 `required` 眼里完全合法。后来加上 `notblank` 才好——它会先去掉两端的空白字符再判断有没有内容。

**记住：`required` ≠ 非空字符串，它等于”不是零值”。** 这个区别在字符串、切片、指针上都存在，语义各不相同。

## 三、map：取不存在的 key 不会报错，会返回零值

```go
func GetMsg(code int) string {
	if msg, ok := messages[code]; ok {
		return msg
	}
	return "未知错误"
}
```

Go 的 map 设计上保证了 `m[k]` 永远不 panic。key 不存在时，返回**值类型的零值**——`map[int]string` 就是 `""`，`map[string]int` 就是 `0`。

麻烦的是你没法区分”这个 key 存的就是空字符串”和”这个 key 压根不存在”。所以要 `v, ok := m[k]` 这种双返回值写法。我的错误码表就是这么写的：查到返回对应消息，查不到返回”未知错误”；要是偷懒不判 `ok`，前端就会收到一个空的 `msg`，然后来问你为什么。

还有个反直觉的点：**map 的遍历顺序是随机的**，每次 `for range` 都不一样，而且 Go 是故意这么设计的（防止有人依赖遍历顺序写出脆弱的代码）。需要顺序就自己排序。

## 四、`any` 和类型断言：装进去容易，取出来要自己说清楚

`any` 是 `interface{}` 的别名（Go 1.18 起），意思是”任意类型”。

```go
type Response struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data any    `json:"data"`
}
```

`Data` 用 `any`，成功时塞业务数据、失败时塞 `nil`，一个结构体就能应付所有接口的响应格式。

东西装进去是无痛的，取出来要**类型断言**：

```go
v, exist := c.Get(key)
if !exist {
	return 0
}
id, ok := v.(*model.TokenInfo)
if !ok {
	return 0
}
return id.UserID
```

`v.(*model.TokenInfo)` 就是在说”我断定 v 里装的是 `*model.TokenInfo`“。两个细节：

1.  **单返回值形式 `v.(T)` 断言失败会直接 panic**，双返回值 `v, ok := x.(T)` 才是安全的。我在中间件里一律用后者——鉴权代码 panic 等于整个服务挂掉。
2.  断言的目标类型必须和塞进去的**完全一致**。我塞的是指针，写成 `v.(model.TokenInfo)`（少了星号）就永远不成立，而且不报错，只是默默走失败分支。

JWT 那边还有个更隐蔽的：

```go
claims := token.Claims.(jwt.MapClaims)
rawUserID := claims["user_id"]
userID := uint(rawUserID.(float64))
```

`claims["user_id"]` 取出来是 `any`，实际类型是 `float64`——**因为 JSON 里的数字统一解析成 float64**。我明明签发的时候传的是 `uint`，取出来却是 `float64`，直接 `.(uint)` 会 panic。这个坑卡了我一阵子。

顺便说，上面这两行其实还有改进空间：`token.Claims.(jwt.MapClaims)` 没做 `ok` 检查，理论上能 panic。写文章的时候回看才发现的。

## 五、函数是一等公民：中间件就是一个”返回函数的函数”

这是我觉得 Go 最优雅的地方，也是 Gin 中间件的工作原理。

```go
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Fail(c, errcode.ErrUnauthorized)
			c.Abort()
			return
		}
		info, err := service.ParseToken(header[7:])
		if err != nil {
			response.Fail(c, errcode.ErrUnauthorized)
			c.Abort()
			return
		}
		c.Set(key, info)
		c.Next()
	}
}
```

`gin.HandlerFunc` 就是个函数类型，底层是 `func(*gin.Context)`。所以 `Auth` 这个函数”返回一个函数”完全合法——函数在 Go 里是普通值，能当参数传、能当返回值。

那为什么要绕这一圈？为了**带参数**：

```go
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		info, ok := c.Get(key)
		// ... 取 TokenInfo
		for _, v := range roles {     // roles 被"记住"了
			if info.Role == v {
				c.Next()
				return
			}
		}
		response.Fail(c, errcode.ErrForbidden)
		c.Abort()
	}
}
```

`roles ...string` 是变参，返回的匿名函数**捕获**了传进来的 `roles`——这就是闭包。于是路由可以写得像自然语言：

```go
r.GET("/api/admin/ping",
	middleware.Auth(),
	middleware.RequireRole(model.RoleLostAdmin, model.RoleSysAdmin),
	handler.Ping)
```

注意 `middleware.Auth()` 后面**有括号**：被调用后返回的那个函数才是真正的中间件。这个理解一旦通了，Gin 中间件就不再神秘。

还有两个必须记住的：

-   `c.Abort()` 是”后面别走了”，`c.Next()` 是”我处理完了，继续往下”。**鉴权失败一定要 Abort**，否则请求照样会打到业务 handler。
-   `for _, v := range roles` 里的第一个值是下标，用不上就用 `_` 丢掉。Go 不允许声明了不用的变量。

## 六、错误是值，不是异常

Go 没有 try/catch。错误就是一个普通的返回值，`error` 是个内置接口。

```go
var ErrUserExists = errors.New("用户已存在")

func RegisterUser(username, password string) (*model.User, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &model.User{Username: username, Password: string(hashed), Role: model.RoleUser}

	err = repository.CreateUser(user)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return nil, ErrUserExists
		}
		return nil, err
	}
	return user, nil
}
```

三个值得说的习惯：

**1\. `if err != nil` 之后立刻 return。** 这个模式会重复很多遍，看着啰嗦；但换来的是错误路径一目了然——你不用去猜哪一行可能抛异常，只要看 `err` 有没有被检查。

**2\. 用 `errors.New` 定义”哨兵错误”，调用方用 `errors.Is` 判断。**

```go
user, err := repository.FindByUsername(username)
if err != nil {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidCredentials
	}
	return nil, err
}
```

这里有个小心思：用户不存在和密码错误，返回的是**同一个错误**。这是故意的——如果分开返回，别人就能把登录接口当用户枚举器用，一个个试出哪些用户名已经注册。这叫**用户枚举防护**。

**3\. 在边界层做错误翻译。** `strings.Contains(err.Error(), "Duplicate entry")` 这行有点丑，它是去匹配 MySQL 的原始报错文本；但唯一约束在数据库层面，这是最直接的做法。重点在于**别让数据库的报错原文漏给前端**，翻译成 `ErrUserExists` 再说。

最后一个坑：\*\*`error` 是接口，接口可能是 nil，但”装了 nil 指针的接口”不等于 nil。\*\*

```go
func f() error {
	var p *MyErr = nil
	return p      // 返回值不是 nil！
}
```

函数返回 `(*User, error)` 这种组合时要特别小心，别在这种地方让调用方判断失误。

## 七、`defer`：拿到资源的那一行就写好怎么收尾

```go
opened, err := fh.Open()
if err != nil {
	return "", err
}
defer opened.Close()

f, err := os.Create(filepath.Join(uploadDir, photo))
if err != nil {
	return "", err
}
defer f.Close()

_, err = io.Copy(f, opened)
```

`defer` 的语义是”函数返回**之前**执行”，不管是正常 return 还是中途 return。上面这段如果不用 `defer`，得在四个出错分支里各写一次 `Close`，漏一个就泄漏一个文件句柄。

两个小知识：

-   多个 `defer` 是**后进先出**执行的（栈的顺序）。
-   `defer` 后面函数的**参数在注册那一刻就求值了**，不是执行时才求值。所以 `defer f(x)` 里的 `x` 是当时的 `x`。

## 八、包和目录：`internal` 是编译器帮你守的门

最后说点代码之外的。

```nix
gin-demo/
├── main.go
├── internal/          # 只有本项目能 import
│   ├── handler/       # 收请求、校验参数、调 service
│   ├── service/       # 业务逻辑（哈希、判重、签发 token）
│   ├── repository/    # 只管数据库读写
│   └── model/         # 结构体定义
└── pkg/               # 可以被别的项目 import
    ├── config/        # 读环境变量
    ├── errcode/       # 错误码
    └── response/      # 统一响应格式
```

几条规则：

**大写开头才能被别的包访问。** `func SavePhoto` 能被 handler 调，写成 `savePhoto` 就只有 service 包内部能用。这是 Go 唯一的作用域机制——没有 `public`/`private` 关键字，看首字母大小写就够了。

**`internal/` 是硬性约束。** 这个目录下的包，外部项目在**编译期**就 import 不了。而 `pkg/` 只是社区约定，语言层面没有任何保护。我一开始把 config 放在 internal 里，后来想明白了：它其实是我们这套服务的配置约定，放 pkg 更符合习惯。

**分层的意义是”能单独改、能单独测”。** 一开始我所有逻辑写在 handler 里，改一个校验规则要翻整个文件。拆完之后，换 token 实现只动 service，换数据库只动 repository，handler 一行不用改。

## 写在最后

回头看，真正卡住我的其实不是”Go 语法难”，而是这三类东西：

-   **看起来像别的语言、行为却不一样**——`:=` 是声明会遮蔽、`required` 不等于非空、JSON 数字是 float64。
-   **需要重新建心智模型**——错误是值、函数是值、闭包捕获、map 遍历无序。
-   **代码之外的工程习惯**——别硬编码密钥、分层、拿到资源立刻 defer。

哦对，说到硬编码密钥。最开始我的数据库密码就直接写在 `main.go` 的字符串里。私有仓库看着没事，可一旦要发文章、截图、开源，密码就跟着飞出去了。JWT 密钥更危险——它泄露了，任何人都能伪造别人的身份登录。后来我抽了个 config 包，先把密钥挪了进去：

```go
func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

var JWTSecret = getEnv("JWT_SECRET", "")
```

默认值给空串，逼自己必须在环境变量里配。

（说来惭愧，数据库那串 DSN 现在还原封不动躺在 `main.go` 里没搬完——写这篇文章正好提醒了我，回去就补上。**另外，这篇文章贴出来之前我逐段检查过，确认没有真实密码和密钥漏出去。**）

如果你也在从零上手 Go 后端，我的建议是：别先啃完语法书再动手。直接写一个你真正要用的东西——只有三个接口的 CRUD 也行——卡住了再去查。踩过的坑才会真的记住。
