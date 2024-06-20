class Komga extends ComicSource {

    // 此漫画源的名称
    name = "Komga"

    // 唯一标识符
    key = "Komga"

    version = "1.0.0"

    minAppVersion = "3.1.0"

    host = "http://192.168.5.4:25600"

    // 更新链接
    url = "http://192.168.5.225:8080/komga.js"

    categories = []

    /// APP启动时或者添加/更新漫画源时执行此函数
    init() {
    }

    /// 账号
    /// 设置为null禁用账号功能
    account = {
        /// 登录
        /// 返回任意值表示登录成功
        login: async (account, pwd) => {
            let authorization = `Basic ${Convert.encodeBase64(account + ':' + pwd)}`
            let res = await Network.get(this.host + '/api/v2/users/me?remember-me=true', {
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
                'Authorization': authorization
            })

            if (res.status === 200) {
                this.saveData('Authorization', authorization)
                return 'ok'
            }

            throw `Failed to login ${res.status}`
        },

        // 退出登录时将会调用此函数
        logout: () => {
            this.deleteData('Authorization')
            Network.deleteCookies(this.host)
        },

        registerWebsite: "https://www.copymanga.site/web/login/loginByAccount"
    }


    /**
     * 获取章节列表
     * @param id
     */
    loadChapters = async (id) => {
        let body = JSON.parse((await Network.get(`${this.host}/api/v1/series/${id}/books?page=0&size=3000&sort=metadata.numberSort,asc`)).body)
        let content = body.content
        let map = {}
        content.forEach(it => {
            map[it.id] = it.metadata.title
        })
        return map
    }

    /// 探索页面
    /// 一个漫画源可以有多个探索页面
    explore = [
        {
            /// 标题
            /// 标题同时用作标识符, 不能重复
            title: "Komga",

            /// singlePageWithMultiPart 或者 multiPageComicList
            type: "multiPageComicList",

            load: async (page) => {
                page = page - 1
                let res = await Network.get(this.host + `/api/v1/series?page=${page}&size=20&sort=createdDate,desc`)

                if (res.status !== 200) {
                    throw `Invalid status code: ${res.status}`
                }

                let body = JSON.parse(res.body)
                let content = body["content"]
                let host = this.host

                function parseComic(comic) {
                    let metadata = comic.metadata
                    let cover = `${host}/api/v1/series/${comic.id}/thumbnail`
                    return {
                        id: comic.id,
                        title: metadata.title,
                        subTitle: "",
                        cover: cover,
                        tags: metadata.tags,
                        description: ""
                    }
                }

                return {
                    comics: content.map(parseComic),
                    // 没找到最大页数的接口
                    maxPage: body["totalPages"]
                }
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
            let host = this.host
            page = page - 1
            let body = JSON.parse((await Network.get(`${host}/api/v1/series?size=20&search=${keyword}&oneshot=false&page=${page}&size=20`)).body)

            function parseComic(comic) {
                let metadata = comic.metadata
                let cover = `${host}/api/v1/series/${comic.id}/thumbnail`
                return {
                    id: comic.id,
                    title: metadata.title,
                    subTitle: "",
                    cover: cover,
                    tags: metadata.tags,
                    description: ""
                }
            }

            return {
                comics: body.content.map(parseComic),
                maxPage: body["totalPages"]
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
            let body = JSON.parse((await Network.get(`${host}/api/v1/series/${id}`)).body)
            let cover = `${host}/api/v1/series/${id}/thumbnail`
            let thumbnails = []
            let metadata = body.metadata

            return {
                // string 标题
                title: metadata.title,
                // string 封面url
                cover: cover,
                // string
                description: "",
                // Map<string, string[]> | object 标签
                tags: {
                    "标签": metadata.tags
                },
                // Map<string, string>? | object, key为章节id, value为章节名称
                // 注意: 为了保证章节顺序, 最好使用Map, 使用object不能保证顺序
                // this.loadChapters(id)
                chapters: await this.loadChapters(id),
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
            let body = JSON.parse((await Network.get(`${this.host}/api/v1/books/${epId}/pages`)).body)

            let images = body
                .map(it => `${this.host}/api/v1/books/${epId}/pages/${it.number}`);

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
