<template>
  <div class="admin-view-container">
    <table class="admin-view-table">
      <thead>
        <tr>
          <th>id</th>
          <th>sid</th>
          <th>상태</th>
          <th>응답수</th>
          <th>주문일</th>
          <th>마감일</th>
          <th>가격</th>
          <th>소요시간</th>
          <th>제목</th>
          <th>성별</th>
          <th>나이대</th>
          <th>타겟</th>
          <th>고객명</th>
          <th>선택신분</th>
          <th>상세보기</th>
          <th>엑세스</th>
          <th>삭제</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in surveyList" :key="item.id" :class="{red:item.status=='CREATED'||item.status=='WAITING', green:item.status=='IN_PROGRESS'}">
          <td>{{item.id}}</td>
          <td>{{item.sid}}</td>
          <td>
            <select id="admin-survey-select" v-model="item.status" @change="updateStatus(item)">
              <option :value="String('CREATED')" >주문 완료 (0)</option>
              <option :value="String('WAITING')" >검수 대기 (1)</option>
              <option :value="String('IN_PROGRESS')" >진행중 (2)</option>
              <option :value="String('DONE')" >완료 (3)</option>
              <option :value="String('REFUND_PARTIAL')" >부분 환불 (4)</option>
              <option :value="String('REFUND_ALL')" >전체 환불 (5)</option>
              <option :value="String('CANNOT')" >진행 불가 (6)</option>
            </select>
          </td>
          <td style="cursor:pointer;" @click="moveToResposneListPage(item.id)">{{item.responseCount}} / {{item.headCount.substring(5)}}</td>
          <td>{{item.uploadedAt.substring(0, 16)}}</td>
          <td>{{item.dueDate.substring(0, 16)}}</td>
          <td>{{item.price}}</td>
          <td>{{this.$store.state.maps.surveySpendTimeMap[item.spendTime]}}</td>
          <td><a target="_blank" :class="{red:item.status=='CREATED'||item.status=='WAITING', green:item.status=='IN_PROGRESS', black:item.status=='DONE'}" :href=item.link>{{item.title}}</a></td>
          <td>{{this.$store.state.maps.surveyTargetGenderMap[item.targetGender]}}</td>
          <td>
            <div v-for="age in item.targetAgeListStr.split(', ')" :key="age.value">{{this.$store.state.maps.surveyTargetAgeMap[age]}}</div>
          </td>
          <td>{{item.targetInput}}</td>
          <td>{{item.username}}</td>
          <td>{{this.$store.state.maps.surveyIdentityMap[item.identity]}}</td>
          <td><button @click="moveToSurveyDetailPage(item.id, item)">상세</button></td>
          <td><button @click="sendWrongAccessMail(item.id)">발송</button></td>
          <td><button @click="deleteSurvey(item.id)">X</button></td>
          <!-- <td><button @click="updateSurvey(item.id, item.progress)">적용</button></td> -->
        </tr>
      </tbody>
    </table>
    <button @click="prevPageSet" :disabled="startPage === 1">이전</button>
    <button class="page-btn"
      v-for="i in displayedPages" 
      :key="i" 
      @click="loadMoreSurveys(i-1)" 
      :class="{ active: currentPage === i }">
      {{ i }}
    </button>
    <button @click="nextPageSet" :disabled="endPage >= totalPages">다음</button>
  </div>
  
  <div v-if="editModal == true" class="edit-modal">
    <div class="edit-contentsbox">
      <div id="edit-top">
        <a class="edit-close" @click="closeModal">X</a>
        <p class="edit-title">설문 정보 입력하기</p>

      </div>
  
      <div id="edit-container">
        <div id="detail-title">리워드 (필수)</div>
          <input class="modal-input" type="text" v-model="editInfo.reward">
          <div v-if="this.editModalNotice==true" id="modal-notice-red">* 리워드를 입력해주세요</div>

        <div id="detail-title">패널 유의사항 (선택)</div>
        <div id="modal-notice">* 고객 입력 : {{this.editInfo.notice!='' ? editInfo.notice : '없음'}}</div>
          <input class="modal-input" type="text" v-model="editInfo.noticeToPanel">
        
        <div id="detail-title">링크 수정 (선택)</div>
          <input class="modal-input" type="text" v-model="editInfo.link">
        
        <button id="edit-fin-btn" @click="updateSurvey">수정 완료</button>
        
      </div> 
    </div>
  </div>
</template>

<script>
import { instanceWithAuth } from '../../api/index'
export default {
  data(){
    return {
      totalPages: 0,
      startPage: 1,
      endPage: 10,
      currentPage : 1,
      progressList : [
        { name: 0, value: 0},
        { name: 2, value: 2},
        { name: 3, value: 3}
      ],
      progressChanged: null,
      surveyList : [],

      editInfo: {
        id : 0,
        status : '',
        reward : 0,
        noticeToPanel: '',
        notice: '',
        link: ''
      },
      editModal : false,
      editModalNotice : false,
    }
  },
  computed: {
    displayedPages() {
      const pages = [];
      console.log(this.startPage, this.endPage, this.totalPages)
      for (let i = this.startPage; i <= Math.min(this.endPage, this.totalPages); i++) {
        
        pages.push(i);
      }
      console.log(pages)
      return pages;
    },
  },
  mounted(){
    this.listAdminSurveys()
  },
  methods : {
    async listAdminSurveys(){
      console.log('listAdminSurveys')
      try{
        const response = await instanceWithAuth.get("/survey/admin?page=0")
        this.surveyList = response.data.surveyList
        this.totalPages = response.data.pageInfo.totalPages
        this.updatePageRange()
      }catch(error) {
        console.log(error)
      }
    },
    
    async loadMoreSurveys(i) {
      console.log('loadMoreSurveys')
      try {
        const response = await instanceWithAuth.get("/survey/admin?page=" + i)
        this.surveyList = response.data.surveyList
        this.currentPage = i+1
      } catch(err) {
        console.log(err)
      }
    },

    updatePageRange() {
      const rangeSize = 10;
      const currentRangeStart = Math.floor(this.currentPage / rangeSize) * rangeSize + 1;
      this.startPage = currentRangeStart;
      this.endPage = Math.min(currentRangeStart + rangeSize - 1, this.totalPages);
    },
    prevPageSet() {
      if (this.startPage > 1) {
        this.startPage -= 10;
        this.endPage = this.startPage + 9;
      }
    },
    nextPageSet() {
      if (this.endPage < this.totalPages) {
        this.startPage += 10;
        this.endPage = Math.min(this.startPage + 9, this.totalPages);
      }
    },

    async sendWrongAccessMail(id) {
      try {
        if(window.confirm("엑세스 링크 오류 안내 메일을 발송하시겠습니까?")) {
           await instanceWithAuth.get("/survey/admin/" + id + "/mail/access")
          .then(
            alert('메일 발송이 완료되었습니다'),
            this.listAdminSurveys()
          )
        } else {
            return;
        }
      } catch(err) {
        console.log(err)
      }
    },

    async deleteSurvey(id) {
      try {
        if(window.confirm("설문을 삭제하시겠습니까?")) {
           await instanceWithAuth.delete("/survey/admin/" + id)
          .then(
            alert('삭제되었습니다'),
            this.listAdminSurveys()
          )
        } else {
            return;
        }
      } catch(err) {
        console.log(err)
      }
    },

    moveToSurveyDetailPage(id, survey) {
      this.$store.state.surveyToPass = survey
      const paramToPass = { 'id' : id }
      this.$router.push({ name : 'AdminSurveyDetail', params: {'id' : paramToPass.id}})
    },

    moveToResposneListPage(surveyId) {
      const paramToPass = { 'id' : surveyId }
      const routeData = this.$router.resolve({ name : 'AdminResponse', params: {'id' : paramToPass.id}})
      window.open(routeData.href, '_blank');
    },

    async updateStatus(item) {
      if(item.status == 'IN_PROGRESS' && item.reward == 0) {  // CREATED or WAITING -> IN_PROGRESS
        this.editInfo.id = item.id
        this.editInfo.status = item.status
        this.editInfo.reward = item.reward
        this.editInfo.notice = item.notice
        this.editModal = true
      }

      else {
        await instanceWithAuth.patch(
          `/survey/admin/${item.id}`,
          { status : item.status }
        )
      }
    },

    async updateSurvey() {
      try {
        if(this.editInfo.reward == 0) {
          this.editModalNotice = true
          return
        }

        this.editModalNotice = false
        delete this.editInfo.notice

        if(this.editInfo.noticeToPanel == '') {
          delete this.editInfo.noticeToPanel
        }
        if(this.editInfo.link == '') {
          delete this.editInfo.link
        }

        await instanceWithAuth.patch(
          `/survey/admin/${this.editInfo.id}`,
          this.editInfo
        )
        
        this.editModal = false
        this.$router.go("/admin/survey/order")
      } catch (error) {
        console.log(error)
      }
    },

    closeModal() {
      this.editModal = false
      this.$router.go("/admin/survey/order")
    },

    openModel(item){
      this.editModal = true
      this.editInfo = item
    },

    
  }
}
</script>

<style>
.admin-view-table {
  width: 100%;
  border: 1px solid #444444;
  border-collapse: collapse;
}
#admin-view-survey-table tr, th, td {
  border: 1px solid #444444;
}
#admin-view-survey-table tr, th {
  background: green;
  color: white;
}
#admin-survey-select {
  padding: 10px;
}
.fixed-col {
  width: 400px;
  min-width: 400px;
  max-width: 400px;
}
.red {
  text-decoration-line: none;
  color: rgb(168, 18, 18);
}
.green {
  text-decoration-line: none;
  color: rgb(4, 150, 4);
}
.black {
  text-decoration-line: none;
  color: #444444
}
#detail-title {
  font-size: 16px;
  color: #494949;
  text-align: left;
  font-weight: bold;
  margin: 10px;
}
#edit-fin-btn {
  padding: 7px 15px 7px 15px;
  margin: 15px 0px 0px 0px;
  color: green;
  background-color: #FFFFFF;
  border: 1.5px solid green;
  border-radius: 10px;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: 'Noto Sans KR', sans-serif;
}
#edit-fin-btn:hover{
  color: white;
  background: green;
}
#modal-notice {
  text-align: left;
  color: rgb(187, 187, 187);
  font-size: 13px;
}
#modal-notice-red {
  text-align: left;
  color: rgb(199, 16, 16);
  font-size: 13px;
  margin-bottom: 20px;
}
.page-btn {
  margin-top: 10px;
  margin-bottom: 50px;
  margin-left: 3px;
  margin-right: 3px;
}
.page-btn.active{
  background-color: rgb(116, 163, 116);
}
</style>