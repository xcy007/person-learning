<template>
    <div id="app">
      <div class="card">
          <div class="head">
          <!-- 头部：日期+统计 -->
              <div class="date">{{ today }}</div>
              <h1>今日待办</h1>
              <div class="stat">
                  还剩下<b>{{ remaining }}</b>件事
                  <span>/共{{total}}件事</span>
              </div>
          </div>
      
          <div class="input-row">
            <!-- 输入框 -->
                <input 
                v-model.trim="newTitle"
                type="text" 
                placeholder="请输入待办事项"
                @keyup.enter="addTodo"
                 />
                <button :disabled="!newTitle" @click="addTodo">添加</button>
          </div>
          
          <div class="tabs">
            <!-- 筛选区 -->
             <button 
                v-for="tab in tabs" 
                :key="tab.value" 
                :class="{on: filter===tab.value}"
                @click="filter=tab.value"
                >
                {{ tab.lable }}
            </button>
          </div>

          <ul class="list">
            <!-- 列表 -->
                <li 
                    v-for="item in filterList" 
                    :key="item.id"
                    class="item"
                    :class="{done:item.done}"
                >
                <!-- 【知识点】checkbox 用 :checked + @change，而不是 v-model。
                        因为要拿到 item，直接改 item.done 更明确。 -->
                    <input 
                        type="checkbox" 
                        :check="item.done"
                        @change="toggle(item)"
                    />
                    <span class="text">{{ item.title }}</span>
                    <button class="del" @click="remove(item.id)">x</button>
                </li>
          </ul>

          <div
            v-if="filterList.length===0"
            class="empty"
        >
            <!-- 空状态 -->
             <div class="face">🗒️</div>
             <span>{{ emptyText }}</span>
          </div>

          <div 
            v-if="total>0" 
            class="foot">
            <!-- 底部完成区 -->
             <span>已完成<b>{{ total - remaining }}</b>件事</span>
             <button 
                :disabled="remaining===total" 
                @click="clearDone"
            >
                清除已完成
            </button>
          </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

//数据
const newTitle = ref('');//输入的待办事项
const list = ref([]);//待办事项列表
const filter = ref('all');//筛选条件
const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
const tabs = [
    {lable: '全部', value: 'all'},
    {lable: '未完成', value: 'active'}, 
    {lable: '已完成', value: 'done'}
]

// 派生数据（computed）：能从别的数据算出来的，不要再存一份
const filterList = computed(()=>{
    if(filter.value==='active'){//未完成
        return list.value.filter(i=>!i.done)
    }
    if(filter.value==='done'){//已完成
        return list.value.filter(i=>i.done)
    }
    return list.value;
})
const total = computed(()=>{
    return list.value.length;
})
const remaining = computed(()=>{
    return list.value.filter(i=>!i.done).length
})
const emptyText = computed(()=>{
    if(filter.value==='active'){
        return '暂无未完成事项'
    }
    if(filter.value==='done'){
        return '还没有完成任何事情'
    }
    return '暂无待办事项'
})

// 方法
function addTodo() {
    const title = newTitle.value.trim();
    if(!title) return;
    //unshift()是加到数组开头
    list.value.unshift({
        id:Date.now(),
        title,
        done:false
    })
    newTitle.value = '';//清空输入框
}
function toggle(item){
    item.done = !item.done;//未完成变已完成，已完成变未完成
}
function remove(id){
    // filter 返回新数组，所以要重新赋值给 list.value
    list.value = list.value.filter(i=>i.id!==id)//逐项检查，保留 i.id 不等于目标 id 的项。
}
function clearDone(){
    list.value = list.value.filter(i=>!i.done)
}

//副作用：跟「外部世界」打交道（localStorage、接口、DOM）
const STORAGE_KEY = 'todo-demo-list'

 // onMounted：页面挂载完成后执行一次，适合在这里读本地数据
 onMounted(()=>{
    try{
        const data = localStorage.getItem(STORAGE_KEY)
        if(data){//如果有数据，就解析并赋值给 list.value
            list.value = JSON.parse(data)
    }
    }catch(e){
        console.warn('读取本地数据失败', e)
    }
 })

// watch：盯着数据变化，变了就写回本地。
// { deep: true } 是因为数组里每个对象的 done 属性变了也算变化，
// 不加 deep 的话只有数组整体被替换才触发。
watch(list,()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(list.value))

},{deep:true})

</script>

<style scoped>
#app {
  width:100%;
  height:100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}
.card{
    width:100%;
    max-width: 600px;
    height:100%;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}
.head{
    background: linear-gradient(135deg, #3b6ef5, #5b8cff);
    color: rgb(255, 255, 255);
    padding: 24px,24px,20px,;
}
.head .date{
    font-size: 14px;
    padding-left: 10px;
    padding-top: 10px;
}
.head h1{
    font-size: 24px;
    font-weight: bold;
    padding-left: 10px;
}
.head .stat{
    font-size: 14px;
    padding-left: 10px;
    padding-bottom: 10px;
}
.input-row{
    display: flex;
    gap:8px;
    padding: 16px 20px;
}
.input-row input{
    flex: 1;
    height: 40px;
    padding: 0 10px;
    border: 1px solid #dee8f7;
    border-radius: 6px;
    transition: border-color 0.2s;
    font-size: 14px;
    font-family: inherit;
    outline: none;
}
.input-row input:focus{
    border-color: #3b6ef5;
}
.input-row button{
    height: 40px;
    padding: 0 20px;
    background-color: #3b6ef5;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    align-items: center;
    justify-content: center;
}
.input-row button:disabled{
    background-color: #aeb3bd;
    cursor: not-allowed;
}
.tabs{
    display: flex;
    gap: 6px;
    padding: 0 20px 12px;
}
.tabs button{
    font-size: 13px;
    padding:6px 12px;
    color: #646a73;
    background: #f2f3f5;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    font-family: inherit;

}
.tabs button.on{
    background-color: #3b6ef5;
    color: #fff;
}
.list{
    list-style: none;
    padding: 0 12px;
}
.item{
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 8px;
    border-bottom: 1px solid #f2f3f5;
}
.item :last-child{
    border-bottom: none;
}
.item.done .text{
    text-decoration: line-through;
    color: #aeb3bd;
}
.item input[type="checkbox"]{
    width: 15px;
    height: 15px;
    cursor: pointer;
    accent-color: #3b6ef5;
}
.item .text{
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-all;

}
.item .del{
    width: 28px;
    height: 28px;
    font-size: 16px;
    color: #646a73;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}
.item .del:hover{
    color: #f56c6c;
    background-color: #fddbdb;
}
.empty{
    padding: 40px 20px;
    color: #aeb3bd;
    text-align: center;
    font-size: 14px;
}
.empty .face{
    font-size: 40px;
    margin-bottom: 10px;
}
.foot{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-top:1px solid #f2f3f5;
    font-size: 14px;
    color: #646a73;
}
.foot button{
    padding: 6px 12px;
    background-color:none;
    color: #3b6ef5;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;

}
.foot button:disabled{
    color: #afacac;
    cursor: not-allowed;
}
</style>
