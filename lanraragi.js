class LANraragi extends ComicSource {

    // 此漫画源的名称
    name = "LANraragi"

    // 唯一标识符
    key = "LANraragi"

    version = "1.0.0"

    minAppVersion = "3.1.0"

    host = "http://192.168.5.4:7788"

    // 更新链接
    url = "http://192.168.5.225:8080/index.js"

    categories = ["a"]

    /// APP启动时或者添加/更新漫画源时执行此函数
    init() {
    }

    /// 账号
    /// 设置为null禁用账号功能
    account = null

    /// 探索页面
    /// 一个漫画源可以有多个探索页面
    explore = [
        {
            /// 标题
            /// 标题同时用作标识符, 不能重复
            title: "LANraragi",

            /// singlePageWithMultiPart 或者 multiPageComicList
            type: "singlePageWithMultiPart",

            load: async () => {
                let res = await Network.get(this.host + "/api/search/random?count=20")

                if (res.status !== 200) {
                    throw `Invalid status code: ${res.status}`
                }

                let data = JSON.parse(res.body)["data"]
                let host = this.host

                function parseComic(comic) {
                    let cover = `${host}/api/archives/${comic.arcid}/thumbnail`
                    return {
                        id: comic.arcid,
                        title: comic.title,
                        subTitle: "",
                        cover: cover,
                        tags: comic.tags.split(","),
                        description: ""
                    }
                }

                let comics = {}
                comics["随机"] = data.map(parseComic)

                return comics
            }
        }
    ]

    /// 分类页面
    /// 一个漫画源只能有一个分类页面, 也可以没有, 设置为null禁用分类页面
    category = null

    /// 分类漫画页面, 即点击分类标签后进入的页面
    categoryComics = null

    /// 搜索
    search = {
        load: async (keyword, options, page) => {
            let length = 10
            let start = (page - 1) * length
            let host = this.host
            let body = JSON.parse((await Network.get(`${host}/search?search[value]=${keyword}&start=${start}&length=${length}`)).body)
            let recordsFiltered = body["recordsFiltered"]
            let maxPage = recordsFiltered / length > 0 ? (recordsFiltered / length) + 1 : recordsFiltered / length

            function parseComic(comic) {
                let cover = `${host}/api/archives/${comic.arcid}/thumbnail`
                return {
                    id: comic.arcid,
                    title: comic.title,
                    subTitle: "",
                    cover: cover,
                    tags: comic.tags.split(","),
                    description: ""
                }
            }

            return {
                comics: body.data.map(parseComic),
                maxPage: maxPage
            }
        },

        // 提供选项
        optionList: []
    }

    /// 收藏
    favorites = {
        /// 是否为多收藏夹
        multiFolder: false,
        /// 添加或者删除收藏
        addOrDelFavorite: async (comicId, folderId, isAdding) => {
            throw `暂无收藏功能`;
        },
        // 加载收藏夹, 仅当multiFolder为true时有效
        // 当comicId不为null时, 需要同时返回包含该漫画的收藏夹
        loadFolders: async (comicId) => {
            throw `暂无收藏功能`;
        },
        /// 加载漫画
        loadComics: async (page, folder) => {
            return {
                comics: [],
                maxPage: 1
            }
        }
    }

    /// 单个漫画相关
    comic = {
        // 加载漫画信息
        loadInfo: async (id) => {
            let host = this.host
            let body = JSON.parse((await Network.get(`${host}/api/archives/${id}/metadata`)).body)
            let cover = `${host}/api/archives/${id}/thumbnail`
            let thumbnails = []
            return {
                // string 标题
                title: body.title,
                // string 封面url
                cover: cover,
                // string
                description: "",
                // Map<string, string[]> | object 标签
                tags: {
                    "标签": body.tags.split(",")
                },
                // Map<string, string>? | object, key为章节id, value为章节名称
                // 注意: 为了保证章节顺序, 最好使用Map, 使用object不能保证顺序
                chapters: {1: "1"},
                // bool 注意, 如果是多收藏式的网络收藏, 将此项设置为null, 从而可以在漫画详情页面, 对每个单独的收藏夹执行收藏或者取消收藏操作
                isFavorite: false,
                // string?
                subId: "",
                // string[]?
                thumbnails: thumbnails
            }
        },
        // 获取章节图片
        loadEp: async (comicId, epId) => {
            let body = JSON.parse((await Network.get(`${this.host}/api/archives/${comicId}/files?force=false`)).body)

            let images = body["pages"]
                .map(url => this.host + "/" + url);

            return {
                // string[]
                images: images
            }
        },
        // 可选, 调整图片加载的行为; 如不需要, 删除此字段
        onImageLoad: (url, comicId, epId) => {
            return {}
        },
        // 加载评论
        loadComments: async (comicId, subId, page, replyTo) => {
            return {
                comments: [],
                // number
                maxPage: 1,
            }
        },
        // 发送评论, 返回任意值表示成功
        sendComment: async (comicId, subId, content, replyTo) => {
            throw `暂无评论功能`;
        }
    }
}
