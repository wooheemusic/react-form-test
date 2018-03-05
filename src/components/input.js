import React, { Component } from 'react'

/**
 * 
 * ** 초기화
 * 이 컴포넌트의 커스터마이징은 attribute로부터 받아와서 constructor에서 처리한다. 그 값들은 static해야한다.
 * vaildation은 array형태로 사질 수 있으며, 각각의 값은 index의 순서대로 priority를 가진다. (0이 최상위)
 * 부가적으로 required, type, pattern, message, assert* 등을 이용하여 커스터마이징 할 수 있다.
 * 
 * ** 초기화 인터페이스의 예
 * 
 * <Input 
 * name="username" 
 * onValidated={this.onValidated}
 * disabled={this.state.loading} 
 * submitted={this.state.submitted} 
 * validation={[ 'required', 'email' ]}
 * assertTrue={{ api : authService.emailExist, message : "does not exist"}}  // api의 값이 false를 리턴하면 isValid 값을 false
 * /> 
 * 
 * <Input 
 * name="username" 
 * onValidated={this.onValidated}
 * disabled={this.state.loading} 
 * submitted={this.state.submitted} 
 * type="email"
 * required
 * pattern="^[\w]+@[\w\.]*\w+$"
 * message="not match"
 * assertTrue={{ regex: /^[\w]+@[\w\.]*\w+$/, message: "not match"}}
 * assertFalse={{ api : authService.emailExist, message : "already in use"}}  // api의 값이 false를 리턴하면 isValid 값을 true
 * /> // api는 boolean 또는 Promise 객체를 리턴해야한다.
 * 
 * validation은 ['required', 'email'] 등으로 사용할 수 있고, 내장 패턴과 내장 메시지를 이용한다.
 * type, pattern, required, assert*를 해석하여 자체적인 validation을 커스터마이징할 수 있다(예를 들어, type="email"일 경우, type="text"로 변환 후 페턴 적용), 이 경우는 validation이 필요없고, 중복되더라도 상관없다. 
 * pattern과 assertFalse는 가장 낮은 priority를 가지지만, validation에 ['required', 'pattern', 'assertTrue', 'email'] 등을 명시함으로써 priority를 설정할 수 있다.
 * message는 pattern에만 관련된 message이다.
 * pattern/message 대신에 assertTrue/regex를 사용할 수 있다
 * validation={[ 'required', { regex: /^[\w]+@[\w\.]*\w+$/, message: "not match" } ]} 방식으로도 할 수 있다.
 * 
 * <Input name="confirmation" type="password" match={this.state.password}> // password 비교
 * 
 * ** 내부 코드 구현 계획
 * 이 프로세스의 초기화는 constructor에서만 구현되고 동적으로 변경하는 것을 금한다. 
 * (https://github.com/getify/You-Dont-Know-JS/blob/master/es6%20%26%20beyond/ch2.md의 nested default를 이용하려 했으나, 그냥 Object.assgin만을 이용)
 * 커스텀 메세지도 우선적으로 translate를 색인하는 것을 원칙으로 한다.
 * 
 * ** 고민 중이 사항
 * 서버로의 요청일때만 onBlur에 validation을 할지 생각중입니다. 나머지 경우는 onChange에 validation.
 * 왜냐하면, password confirmation 등을 체크할 때, focus를 이탈하지 않아도 타입하는 도중에 validation이 맞는지 확인하는 것이 보통이기 때문입니다.
 * 
 * ** form에서의 구현 예
 * this.state.validity =
 * {
 *  username : false, // true || false || Promise  
 *  password : false,
 * }
 *
 * async problem  
 * asunchronous validation result는 Promise
 * validity.username instanceof Promise를 체크하여, true이면 해당 input을 disable한다.
 * 
 * 기타
 * autofocus, autocomplete, checked, disabled, multiple, readonly 등 boolean attribute는 input element까지 전달되도록 합니다.
 * autocomplete과 componentDidMount의 순서를 확인해야합니다(테스트 예정)
 * 
 * 구현하지 않은 항목들
 * 여러가지 타입들 고려하지 않음, 일단은 text, password, email만을 고려하였습니다.
 * 
 */

export default class Input extends Component {

  constructor(props) {
    super(props)

    // 브라우져의 기본 행동을 막을 type의 리스트 입니다.  
    let supressedTypeList = [ 'email' ] // type의 종류가 무수히 많으므로 좀 더 알아보고 추가할 예정.

    // invariants 설정
    this.name = this.props.name
    this.validation = Object.assign([], this.props.validation)

    //bind events
    this.onChange = this.onChange.bind(this)
    this.onBlur = this.onBlur.bind(this)

    this.state = {
      touched: false,
      loading: false,
      value: '',
      validity: true,
      validationMessage : ''
    }
  }

  componentDidMount() {
    const name = this.name
    const value = this.state.value
    console.log(name, 'mounted with', value)
    this.props.onValidated(name, this.validatePattern(name, value))
  }

  onChange(e) {
    const {name, value} = e.target
    // console.log(this.props.value, value)
    this.setState((prev, props)=> {
      return { counterValue : ++prev.counterValue } 
    
    } ) 
  }

  onBlur(e) {
    console.log('Input blur', e.target)
    const {name, value} = e.target
    this.props.onValidated(name, this.validatePattern(name, value))
  }

  validatePattern(name, value) {
    switch (name) {
      case "username":
        // return /^[\w]+@[\w\.]*\w+$/.test(value)
        const that = this
        return new Promise((s, f) => { 
          // setTimeout(()=>{s('hello')}, 5000) 
          s('hello')
        })
          .then((v)=>{
            this.props.onValidated(name,v)
            return v;
          })
      case "password":
        return /.+/.test(value)
      case "vpc":

      default:
        return false
    }
  }
  
  render() {
    const { name, value, onChange } = this.props
    let validity = this.props.validity;
    validity = validity instanceof Promise ? "loading" : validity
    // if (validity instanceof Promise) {
    //   validity = await validity
    // }
    // console.log(name, validity)
    // if (this.props.submitted){
    //   this.props.onValidationChange(name, this.validatePattern(name, value))
    // }
    console.log('Input render, props :', this.props)
    console.log('Input render, state :', this.state)
    return (
      <div>
        <input type="text" name={this.name} value={value} onChange={this.onChange} onBlur={this.onBlur} />
        {validity}
      </div>
    )
  }
}
