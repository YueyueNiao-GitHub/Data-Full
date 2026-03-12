// Data Fill - 默认字段数据
// 定义所有默认字段和文件夹

const DEFAULT_FIELDS = {
    // AI 字段
    aiFields: [
        {
            id: 'ai_new_title',
            name: '新闻标题',
            type: 'text',
            method: 'ai',
            icon: '⚡',
            iconBg: '#f3e8ff',
            iconColor: '#9333ea',
            tags: ['文本', '一段可以生成新闻标题的字段']
        },
        {
            id: 'ai_short_desc',
            name: '简短描述',
            type: 'text',
            method: 'ai',
            icon: '⚡',
            iconBg: '#f3e8ff',
            iconColor: '#9333ea',
            tags: ['文本', '一段可以生成简短描述的字段']
        }
    ],

    // 默认字段
    defaultFields: [
        {
            id: 'person_name',
            name: '人员姓名',
            type: 'text',
            method: 'random',
            icon: '👤',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['文本', '随机', '可重复']
        },
        {
            id: 'date_time',
            name: '日期时间',
            type: 'date',
            method: 'random',
            icon: '📅',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['日期', '顺序', 'YYYY-MM-DD']
        },
        {
            id: 'number_value',
            name: '数字数值',
            type: 'number',
            method: 'random',
            icon: '#',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['数字', '随机', '范围']
        },
        {
            id: 'serial_number',
            name: '排列序号',
            type: 'number',
            method: 'sequence',
            icon: '🔢',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['数字', '顺序', '自增']
        },
        {
            id: 'phone_number',
            name: '手机号码',
            type: 'text',
            method: 'random',
            icon: '📱',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['文本', '随机', '手机号']
        },
        {
            id: 'email_address',
            name: '电子邮箱',
            type: 'text',
            method: 'random',
            icon: '✉️',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['文本', '随机', '邮箱']
        },
        {
            id: 'department',
            name: '所属部门',
            type: 'text',
            method: 'random',
            icon: '🏢',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['文本', '随机', '部门']
        },
        {
            id: 'address',
            name: '所属地址',
            type: 'text',
            method: 'random',
            icon: '📍',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['文本', '随机', '地址']
        }
    ],

    // 人事领域 (HR)
    hrFields: [
        {
            id: 'hr_employee_id',
            name: '员工编号',
            type: 'text',
            method: 'sequence',
            icon: '🆔',
            iconBg: '#fef3c7',
            iconColor: '#d97706',
            tags: ['文本', '顺序', '编号']
        },
        {
            id: 'hr_position',
            name: '职位名称',
            type: 'text',
            method: 'random',
            icon: '💼',
            iconBg: '#fef3c7',
            iconColor: '#d97706',
            tags: ['文本', '随机', '职位']
        }
    ],

    // 财务领域 (Finance)
    financeFields: [
        {
            id: 'finance_amount',
            name: '金额数值',
            type: 'number',
            method: 'random',
            icon: '💰',
            iconBg: '#d1fae5',
            iconColor: '#059669',
            tags: ['数字', '随机', '金额']
        },
        {
            id: 'finance_invoice',
            name: '发票编号',
            type: 'text',
            method: 'sequence',
            icon: '🧾',
            iconBg: '#d1fae5',
            iconColor: '#059669',
            tags: ['文本', '顺序', '发票']
        }
    ],

    // 用户账户领域 (Account / User)
    accountFields: [
        {
            id: 'account_username',
            name: '用户账户名',
            type: 'text',
            method: 'random',
            icon: '👤',
            iconBg: '#fce7f3',
            iconColor: '#db2777',
            tags: ['文本', '随机', '账户']
        }
    ],

    // 订单/交易领域 (Order)
    orderFields: [
        {
            id: 'order_id',
            name: '订单编号',
            type: 'text',
            method: 'sequence',
            icon: '📦',
            iconBg: '#e0e7ff',
            iconColor: '#4f46e5',
            tags: ['文本', '顺序', '订单']
        }
    ],

    // 图片字段
    imageFields: [
        {
            id: 'image_avatar_real',
            name: '真人头像 - Avatar',
            type: 'image',
            method: 'random',
            icon: '👤',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['图片', '随机', '真人头像']
        },
        {
            id: 'image_avatar_cartoon',
            name: '卡通头像 - Avatar',
            type: 'image',
            method: 'random',
            icon: '👤',
            iconBg: '#fce7f3',
            iconColor: '#db2777',
            tags: ['图片', '随机', '卡通头像']
        },
        {
            id: 'image_banner_16_9',
            name: '封面图 16:9 - Banner',
            type: 'image',
            method: 'random',
            icon: '🖼️',
            iconBg: '#dbeafe',
            iconColor: '#2563eb',
            tags: ['图片', '随机', '16:9']
        },
        {
            id: 'image_banner_4_3',
            name: '封面图 4:3 - Banner',
            type: 'image',
            method: 'random',
            icon: '🖼️',
            iconBg: '#d1fae5',
            iconColor: '#059669',
            tags: ['图片', '随机', '4:3']
        }
    ]
};

// 文件夹配置
const FOLDERS = [
    {
        id: 'ai_fields',
        name: 'AI 字段',
        fields: 'aiFields',
        collapsed: false
    },
    {
        id: 'default_fields',
        name: '默认字段',
        fields: 'defaultFields',
        collapsed: false
    },
    {
        id: 'hr_fields',
        name: '人事领域 (HR)',
        fields: 'hrFields',
        collapsed: false
    },
    {
        id: 'finance_fields',
        name: '财务领域 (Finance)',
        fields: 'financeFields',
        collapsed: false
    },
    {
        id: 'account_fields',
        name: '用户账户领域 (Account / User)',
        fields: 'accountFields',
        collapsed: false
    },
    {
        id: 'order_fields',
        name: '订单/交易领域 (Order)',
        fields: 'orderFields',
        collapsed: false
    }
];
