<template>
    <div id="app">
        <div class="card">
            <div class="total">
                <div class="lable">本月支出</div>
                <!-- toFixed(2) 把数字格式化成两位小数，返回值是字符串，正好用来显示 -->
                <div class="num"><small>￥</small>{{ total.toFixed(2) }}</div>
                <div class="sub">共{{logs.length}}笔·平均每笔<small>￥</small>{{ avg.toFixed(2) }}</div>
            </div>

            <div class="form">
                <div class="row">
                    <div class="field">
                        <label>金额</label>
                        <input 
                            v-model.number="form.amount"
                            min="0"
                            styp="0.01"
                            type="number" 
                            placeholder="0.00" 
                            @keyup.enter="addLog"
                        />
                    </div>
                    <div class="field">
                        <label>分类</label>
                        <select v-model="form.category">
                            <!-- 【知识点】v-for 生成 option 时，:value 决定了选中后 v-model 拿到什么值 -->
                            <option 
                                v-for="c in categories" 
                                :key="c.name" 
                                :value="c.name"
                            >
                                {{c.icon}}{{ c.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="row">
                    <div class="field">
                        <label>备注（可空）</label>
                        <input 
                            v-model="form.note"
                            type="text" 
                            placeholder="请输入备注内容" 
                            @keyup.enter="addLog"
                        />
                    </div>
                </div>
                <button 
                    class="add" 
                    :disabled="!form.amount"
                    @click="addLog"
                >记一笔
                </button>
            </div>

            <div class="breakdown" v-if="logs.length">
                <!-- 只有有数据时才显示这块，避免空卡片 -->
                 <h2>花在哪儿了</h2>
                <div 
                    class="bar-row" 
                    v-for="item in breakdown" 
                    :key="item.name"
                >
                    <div class="bar-top">
                        <span>{{item.icon}}{{ item.name }}</span>
                        <span class="amt">￥{{item.amount.toFixed(2)}} · {{item.percent}}%</span>
                    </div>
                    <div class="bar-bg">
                        <!-- 【知识点】:style 绑对象，值可以是字符串表达式。
                            这里把百分比算好塞进 width，是动态样式最典型的用法。 -->
                        <div 
                            class="bar-fill"
                            :style="{width:item.percent + '%',background:item.color}" 
                        >
                        </div>
                    </div>
                </div>
            </div>

            <div class="logs">
                <h2>最近的记录</h2>
                <div class="empty" v-if="!logs.length">还没有记录,先记一笔试试</div>
                <div class="log" v-for="log in logs" :key="log.id">
                    <div class="icon">{{ iconOf(log.category) }}</div>
                    <div class="info">
                        <div class="name">{{ log.note || log.category }}</div>
                        <div class="time">{{ log.time }}</div>
                    </div>
                    <div class="money">{{ log.amount.toFixed(2) }}</div>
                    <button class="rm" title="删除" @click="removeLog(log.id)">x</button>
                </div>
            </div>
        </div>
        
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

/* ─── ① 数据 ─── */
// 【知识点】分类这种「一组固定配置」用普通数组就行，不需要响应式。
// 把颜色也写在配置里，比在模板里写一堆三元判断干净得多。
const categories = [
    { name: '餐饮', icon: '🍜', color: '#ff7a45' },
    { name: '交通', icon: '🚌', color: '#3b6ef5' },
    { name: '购物', icon: '🛍️', color: '#9254de' },
    { name: '居住', icon: '🏠', color: '#36b37e' },
    { name: '其他', icon: '📦', color: '#8a9099' }
];
// 【知识点】表单用 reactive 装成一个对象更整齐：
// 模板里写 form.amount，而不用三个独立的 ref。
// 注意：reactive 不能整体替换，只能改属性；ref 可以整体替换。
const form = reactive({
    amount:null,
    category:'餐饮',
    note:''
})
const logs=ref([]);

/* ─── ② 统计（今天真正的重点） ─── */

// reduce 是「把数组压成一个值」的方法。
// 参数：累加器 sum、当前项 item、初始值 0。
const total = computed(()=>{
    return logs.value.reduce((sum,log)=>sum + log.amount,0)
})
const avg = computed(()=>{
    return logs.value.length ? total.value/logs.value.length : 0
})
// 先按分类分组求和，再算百分比，最后按金额从大到小排序。
// 这一串是「数据处理」的标准套路，几乎所有后台页面都会用到。
const breakdown = computed(()=>{
    if(!total.value) return [];
    const map={};
    logs.value.forEach(log=>{
        map[log.category]=(map[log.category] || 0) + log.amount;
    })
    return Object.keys(map)//取出所有键
        .map(name => {
            const conf = categories.find(c => c.name===name)||{};//取出这个对象
            const amount = map[name];
          return {
            name,
            icon: conf.icon || '📦',
            color: conf.color || '#8a9099',
            amount,
            // Math.round 保留整数百分比；视觉上够用
            percent: Math.round((amount / total.value) * 100)
          };
        })
        .sort((a, b) => b.amount - a.amount);//按照金额从高到低排序
})
function iconOf(name) {//根据名称找图标
    const conf = categories.find(c => c.name === name);
    return conf ? conf.icon : '📦';
}

/* ─── ③ 动作 ─── */
function addLog(){
     // 【易错点】这里不能用 !form.amount 判断，因为金额可能是 0（虽然没意义）。
      // 用 typeof 检查 + 大于 0 更稳。
    const amount = Number(form.amount)
    if(!amount||amount<=0) return
    logs.value.unshift({
        id:Date.now()+Math.random(),
        amount:Math.round(amount * 100) / 100,  // 统一保留两位，避免浮点误差累积
        category:form.category,
        note:form.note.trim(),
        time:new Date().toLocaleString('zh-CN', {
          month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        })
    })

    form.amount = null
    form.note = ''
}
function removeLog(id){
    logs.value = logs.value.filter(l => l.id !== id)
}
 /* ─── ④ 持久化 ─── */
const KEY = 'expense-card'
onMounted(()=>{
    try{
        const raw = localStorage.getItem(KEY)
        if(raw){
            logs.value = JSON.parse(raw)
        }
    }catch(e){
        /*数据坏了就当没有*/ 
    }
})
watch(logs,()=>{
    localStorage.setItem(KEY,JSON.stringify(logs.value))
},{deep:true})
</script>

<style scoped>
#app{
    display: flex;
    justify-content: center;
    padding: 60px 40px;
    min-height: 100vh;
    color: #333;
    background-color:  #eef1f5;
   font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.card{
    width:100%;
    max-width: 600px;
    background-color: #fff;
    border-radius: 18px;
    box-shadow: 0 10px 40px rgba(31, 35, 41, 0.1);
    overflow: hidden;
}

.total{
    padding: 26px 24px 22px;
    background: linear-gradient(135deg, #1f2329, #34383f);
    color: #fff;
}
.total .lable{
    font-size: 14px;
    opacity: 0.7;
}
.total .num{
    font-size: 32px;
    font-weight: 600;
     /* 数字用等宽字体，变化时不会左右抖 */
    font-variant-numeric: tabular-nums;
    margin-top: 6px;
}
.total .num small{
    font-size: 18px;
    font-weight: 400;
    margin-right: 2px;
}
.total .sub{
    font-size: 12px;
    opacity: 0.7;
    margin-top: 8px;
}
.form{
    padding: 18px 20px 6px; 
}
.row{
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}
.field{
    flex:1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.field label{
    font-size: 14px;
    color: #8a9099;
}
input, select{
    width: 100%;
    height: 40px;
    padding: 0 12px;
    background-color: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 10px;
    color: #333;
    transition: border-color 0.2s;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
}
input:focus,select:focus{
    border-color:#1f2329;
}
.add{
    width:100%;
    height:44px;
    padding: 0 12px;
    border:1px solid #dcdfe6;
    border-radius: 10px;
    outline: none;
    font-size: 14px;
    font-family: inherit;
    background: #1f2329;
    color:#fff;
    cursor: pointer;
}
.add:disabled{
    background-color: #c4c8ce;
    cursor: not-allowed;
}
.breakdown{
    padding:14px 20px 4px;
}
.breakdown h2{
    font-size: 13px; 
    color: #8a9099; 
    font-weight: 400; 
    margin-bottom: 10px;
}
.bar-row{
    margin-bottom: 10px;
}
.bar-top{
    display: flex; 
    justify-content: space-between; 
    font-size: 13px; 
    margin-bottom: 5px; 
}
.bar-top .atm{
    color: #646a73; 
    font-variant-numeric: tabular-nums; 
}
.bar-bg{
    height: 6px; 
    background: #f2f3f5; 
    border-radius: 99px; 
    overflow: hidden;
}
.bar-fill{
    height: 100%;
    border-radius: 99px;
    transition: width 0.4s ease;
}
.logs{
    padding: 14px 20px 20px;
}
.logs h2{
    font-size: 13px; 
    color: #8a9099; 
    font-weight: 400; 
    margin-bottom: 10px; 
}
.log{
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid #f2f3f5;
}
.log:last-child{
    border-bottom: none;
}
.log .icon{
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    border-radius: 10px;
    background: #f7f8fa;
    flex-shrink: 0;
}
.log .info{
    flex:1;
    min-width: 0;
}
.log .name{
    font-size: 14px;
}
.log .time{
    font-size: 11px; 
    color: #b0b4ba; 
    margin-top: 2px;
}
.log .money{
    font-size: 15px;
    font-variant-numeric: tabular-nums;
    color: #1f2329;
}
.log .money::before { 
    content: '−¥'; 
    font-size: 12px; 
    color: #8a9099; 
}
.log .rm{
    border: none; 
    background: none; 
    cursor: pointer;
    color: #d0d3d8; 
    font-size: 16px; 
    padding: 0 2px;
}
.log .rm:hover{
    color: #e5484d;
}
.empty { 
    text-align: center; 
    color: #b0b4ba; 
    font-size: 13px; 
    padding: 24px 0; 
}
</style>