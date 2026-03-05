// Data Fill - 数据生成器
// 生成各种类型的随机数据

// 中文姓氏
const SURNAMES = [
    '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
    '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高',
    '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹'
];

// 中文名字
const GIVEN_NAMES = [
    '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军',
    '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平',
    '刚', '桂英', '华', '建华', '文', '辉', '力', '波', '宁', '飞'
];

// 部门列表
const DEPARTMENTS = [
    '技术部', '产品部', '设计部', '市场部', '销售部', '运营部',
    '人力资源部', '财务部', '行政部', '客服部', '研发部', '测试部'
];

// 职位列表
const POSITIONS = [
    '产品经理', '设计师', '工程师', '运营专员', '销售经理', '客服专员',
    '人力资源专员', '财务专员', '行政助理', '测试工程师', '项目经理', '总监'
];

// 城市列表
const CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉',
    '西安', '南京', '天津', '苏州', '长沙', '郑州', '济南', '青岛'
];

// 街道后缀
const STREET_SUFFIXES = ['路', '街', '大道', '巷', '胡同'];

// 序号计数器
let sequenceCounters = {};

// 重置序号
function resetSequence(fieldId) {
    sequenceCounters[fieldId] = 0;
}

// 获取下一个序号
function getNextSequence(fieldId) {
    if (!sequenceCounters[fieldId]) {
        sequenceCounters[fieldId] = 0;
    }
    return ++sequenceCounters[fieldId];
}

// 随机选择数组元素
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 随机整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成随机姓名
function generateName() {
    const surname = randomChoice(SURNAMES);
    const givenName = randomChoice(GIVEN_NAMES);
    return surname + givenName;
}

// 生成随机日期
function generateDate(format = 'YYYY-MM-DD') {
    const year = randomInt(2020, 2026);
    const month = String(randomInt(1, 12)).padStart(2, '0');
    const day = String(randomInt(1, 28)).padStart(2, '0');

    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    } else if (format === 'YYYY/MM/DD') {
        return `${year}/${month}/${day}`;
    } else if (format === 'MM-DD') {
        return `${month}-${day}`;
    }
    return `${year}-${month}-${day}`;
}

// 生成随机数字
function generateNumber(min = 0, max = 100) {
    return randomInt(min, max);
}

// 生成序号
function generateSequence(fieldId, start = 1) {
    return getNextSequence(fieldId);
}

// 生成手机号
function generatePhone() {
    const prefixes = ['138', '139', '158', '159', '188', '189'];
    const prefix = randomChoice(prefixes);
    const suffix = String(randomInt(10000000, 99999999));
    return prefix + suffix;
}

// 生成邮箱
function generateEmail() {
    const domains = ['qq.com', '163.com', '126.com', 'gmail.com', 'outlook.com'];
    const username = 'user' + randomInt(1000, 9999);
    const domain = randomChoice(domains);
    return `${username}@${domain}`;
}

// 生成部门
function generateDepartment() {
    return randomChoice(DEPARTMENTS);
}

// 生成职位
function generatePosition() {
    return randomChoice(POSITIONS);
}

// 生成地址
function generateAddress() {
    const city = randomChoice(CITIES);
    const district = randomChoice(['东城区', '西城区', '朝阳区', '海淀区', '丰台区']);
    const street = randomChoice(['中山', '建国', '人民', '解放', '和平']) + randomChoice(STREET_SUFFIXES);
    const number = randomInt(1, 999);
    return `${city}市${district}${street}${number}号`;
}

// 生成员工编号
function generateEmployeeId(fieldId) {
    const seq = getNextSequence(fieldId);
    return 'EMP' + String(seq).padStart(5, '0');
}

// 生成金额
function generateAmount(min = 100, max = 10000) {
    const amount = randomInt(min, max);
    return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 生成发票编号
function generateInvoiceNumber(fieldId) {
    const seq = getNextSequence(fieldId);
    return 'INV' + String(seq).padStart(8, '0');
}

// 生成用户名
function generateUsername() {
    const prefixes = ['user', 'admin', 'guest', 'member'];
    const prefix = randomChoice(prefixes);
    const suffix = randomInt(1000, 9999);
    return prefix + suffix;
}

// 生成订单编号
function generateOrderId(fieldId) {
    const seq = getNextSequence(fieldId);
    const date = new Date();
    const dateStr = date.getFullYear() +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    return dateStr + String(seq).padStart(6, '0');
}

// 主生成函数
function generateFieldData(field) {
    switch (field.id) {
        case 'person_name':
            return generateName();

        case 'date_time':
            return generateDate('YYYY-MM-DD');

        case 'number_value':
            return String(generateNumber(1, 1000));

        case 'serial_number':
            return String(generateSequence(field.id));

        case 'phone_number':
            return generatePhone();

        case 'email_address':
            return generateEmail();

        case 'department':
            return generateDepartment();

        case 'address':
            return generateAddress();

        case 'hr_employee_id':
            return generateEmployeeId(field.id);

        case 'hr_position':
            return generatePosition();

        case 'finance_amount':
            return generateAmount(100, 50000);

        case 'finance_invoice':
            return generateInvoiceNumber(field.id);

        case 'account_username':
            return generateUsername();

        case 'order_id':
            return generateOrderId(field.id);

        // AI 字段（暂时返回占位文本）
        case 'ai_new_title':
            return '这是一条由 AI 生成的新闻标题示例';

        case 'ai_short_desc':
            return '这是一段由 AI 生成的简短描述示例文本';

        default:
            return '未知字段';
    }
}
