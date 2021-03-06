//post
import { createAction, handleActions } from "redux-actions";
import {produce} from "immer";
import { firestore, storage } from "../../shared/firebase";
import "moment";
import moment from "moment";

import { actionCreators as imageActions } from "./image";


const SET_POST = "SET_POST"
const ADD_POST = "ADD_POST"
const EDIT_POST = "EDIT_POST"
const DELETE_POST = "DELETE_POST"

const setPost = createAction(SET_POST, (post_list) => ({ post_list }));
const addPost = createAction(ADD_POST, (post) => ({ post }));
const editPost = createAction(EDIT_POST, (post_id, post) => ({post_id, post}));
const deletePost = createAction(DELETE_POST, (post_id) => ({post_id}));

const initialState = {
    list: [],
}

// 게시글 하나에는 어떤 정보가 있어야 하는 지 하나 만들어둡시다! :)
const initialPost = {
    // id: 0,
    // user_info: {
    //     user_name: "yoon",
    //     user_Profile: "https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/201911/22/ee69e453-ba32-4e0b-985d-2e2573fb6297.jpg",
    // },
    image_url: "https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/201911/22/ee69e453-ba32-4e0b-985d-2e2573fb6297.jpg",
    contents: "",
    comment_cnt: 0,
    insert_dt: moment().format("YYYY-MM-DD hh:mm:ss"),
};

const editPostFB = (post_id = null, post = {}) => {
    return function (dispatch, getState, { history }) {
      if (!post_id) {
        console.log("게시물 정보가 없어요!");
        return;
      }
  
      const _image = getState().image.preview;
  
      const _post_idx = getState().post.list.findIndex((p) => p.id === post_id);
      const _post = getState().post.list[_post_idx];
  
      console.log(_post);
  
      const postDB = firestore.collection("post");
  
      if (_image === _post.image_url) {
        postDB
          .doc(post_id)
          .update(post)
          .then((doc) => {
            dispatch(editPost(post_id, { ...post }));
            history.replace("/");
          });
  
        return;
      } else {
        const user_id = getState().user.user.uid;
        const _upload = storage
          .ref(`images/${user_id}_${new Date().getTime()}`)
          .putString(_image, "data_url");
  
        _upload.then((snapshot) => {
          snapshot.ref
            .getDownloadURL()
            .then((url) => {
              console.log(url);
  
              return url;
            })
            .then((url) => {
              postDB
                .doc(post_id)
                .update({ ...post, image_url: url })
                .then((doc) => {
                  dispatch(editPost(post_id, { ...post, image_url: url }));
                  history.replace("/");
                });
            })
            .catch((err) => {
              window.alert("앗! 이미지 업로드에 문제가 있어요!");
              console.log("앗! 이미지 업로드에 문제가 있어요!", err);
            });
        });
      }
    };
  };

const addPostFB = (contents="") => {
    return function (dispatch, getState, {history}){
        const postDB = firestore.collection("post");
        const _user = getState().user.user;

        const user_info = {
            user_name: _user.user_name,
            user_id: _user.uid,
            user_profile: _user.user_profile,
        }
        const _post = {
            ...initialPost,
            contents: contents,
            insert_dt: moment().format("YYYY-MM-DD hh:mm:ss"),
        };


        const _image = getState().image.preview;
        console.log(_image);
        
        const _upload = storage
            .ref(`images/${user_info.user_id}_${new Date().getTime()}`)
            .putString(_image, "data_url");
            
            _upload
            .then((snapshot) => {
              snapshot.ref
                .getDownloadURL()
                .then((url) => {
                  // url을 확인해봐요!
                  console.log(url);
                  dispatch(imageActions.uploadImage(url));
                  return url;
                })
                .then((url) => {
                  // return으로 넘겨준 값이 잘 넘어왔나요? :)
                  // 다시 콘솔로 확인해주기!
                  console.log(url);
      
                  postDB
                    .add({ ...user_info, ..._post, image_url: url })
                    .then((doc) => {
                      // 아이디를 추가해요!
                      let post = { user_info, ..._post, id: doc.id, image_url: url };
                      // 이제 리덕스에 넣어봅시다.
                      dispatch(addPost(post));
                      history.replace("/");
                    })
                    .catch((err) => {
                                      window.alert("앗! 포스트 작성에 문제가 있어요!");
                      console.log("post 작성 실패!", err);
                    });
                });
            })
            .catch((err) => {
                      window.alert("앗! 이미지 업로드에 문제가 있어요!");
              console.log(err);
            });
        };
      };


const getPostFB = () => {
    return function (dispatch, getState, {history}){
        const postDB = firestore.collection("post");

        postDB.get().then((docs) => {
            let post_list = [];
            docs.forEach((doc)=>{
                //console.log(doc.id, doc.data());

                //방법 1
                // let _post = {
                //     id: doc.id,
                //     ...doc.data()
                // };

                // let post = {
                //     id: doc.id,
                //     user_info: {
                //         user_name: _post.user_name,
                //         user_Profile: _post.user_profile,
                //         user_id: _post.user_id,
                //     },
                //     image_url: _post.image_url,
                //     contents: _post.contents,
                //     comment_cnt: _post.comment_cnt,
                //     insert_dt: _post.insert_dt,
                // };

                //방법 2
                let _post = doc.data();

                // ['comment_cnt', 'contents', ...] 형태의 배열로 만들어 준다
                let post = Object.keys(_post).reduce((acc, cur) => {

                    if(cur.indexOf("user_") !== -1){
                        return {...acc, user_info: {...acc.user_info, [cur]: _post[cur]}};
                    }
                    return {...acc, [cur]: _post[cur]};
                }, {id: doc.id, user_info: {}});

                post_list.push(post);
            })

            console.log(post_list);

            dispatch(setPost(post_list));
        })
    }
}

const deletePostFB = (post_id = null) => {
    return function (dispatch, getState, { history }) {
      if (!post_id) {
        console.log("게시물 정보가 없습니다!");
        return;
      }
  
      const postDB = firestore.collection("post");
  
      postDB.doc(post_id).delete().then(() => {
        dispatch(deletePost(post_id));
        // history.replace("/");
      }).catch((err) => {
        console.log("실패!", err);
      })
    };
  }

// reducer
export default handleActions(
    {
        [SET_POST]: (state, action) => produce(state, (draft) => {
            draft.list = action.payload.post_list;
        }),
  
        [ADD_POST]: (state, action) => produce(state, (draft) => {
            draft.list.unshift(action.payload.post);
        }),
        [EDIT_POST]: (state, action) =>
            produce(state, (draft) => {
            let idx = draft.list.findIndex((p) => p.id === action.payload.post_id);

            draft.list[idx] = { ...draft.list[idx], ...action.payload.post };
        }),
        [DELETE_POST]: (state, action) => produce(state, (draft) => {
            draft.list = draft.list.filter((p) => p.id !== action.payload.post_id);
            // window.location.reload();
        }),
    },
    initialState
);

// action creator export
const actionCreators = {
    setPost,
    addPost,
    getPostFB,
    addPostFB,
    editPostFB,
    deletePostFB,
  };
  
  export { actionCreators };

