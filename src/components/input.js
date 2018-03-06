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
 * handleChange={this.handleChange}
 * disabled={this.state.loading} 
 * submitted={this.state.submitted} 
 * validation={[ 'required', 'email' ]}
 * assertTrue={{ api : authService.emailExist, message : "does not exist"}}  // api의 값이 false를 리턴하면 isValid 값을 false
 * /> 
 * 
 * <Input 
 * name="username" 
 * handleChange={this.handleChange}
 * disabled={this.state.loading} 
 * submitted={this.state.submitted} 
 * type="email"
 * required
 * pattern="^[\w]+@[\w\.]*\w+$"
 * message="not match"
 * assertTrue={{ regex: /^[\w]+@[\w\.]*\w+$/, message: "not match"}} // regex.test 값이 false이면 validation status도 false
 * assertFalse={{ api : authService.emailExist, message : "already in use"}} // api는 boolean을 리턴, assertFalse는 boolean을 toggle한다
 * 또는 assertFalse={{ async : authService.emailExist, message : "already in use"}}  // async는 Promise 객체를 리턴해야한다. await에 boolean을 리턴해야한다.
 * /> 
 * 
 * validation은 ['required', 'email'] 등으로 사용할 수 있고, 내장 패턴과 내장 메시지를 이용한다.
 * type, pattern, required, assert*를 해석하여 자체적인 validation을 커스터마이징할 수 있다(예를 들어, type="email"일 경우, type="text"로 변환 후 페턴 적용), 이 경우는 validation이 필요없고, 중복되더라도 상관없다. 
 * pattern과 assertFalse는 가장 낮은 priority를 가지지만, validation에 ['required', 'pattern', 'assertTrue', 'email'] 등을 명시함으로써 priority를 설정할 수 있다.
 * async api는 가장 마지막으로 강제 이동된다.
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
 * 서버로의 요청일때만 handleBlur에 validation을 할지 생각중입니다. 나머지 경우는 handleChange에 validation.
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

    console.log('Input constructor')
    // 브라우져의 기본 행동을 막을 type의 리스트 입니다.  
    // let suppressedTypeList = ['email'] // type의 종류가 무수히 많으므로 좀 더 알아보고 추가할 예정.

    // invariants 설정
    this.name = this.props.name
    this.type = this.props.type === 'email' ? 'text' : this.props.type // 일단 이렇게;;;

    // validations attribute의 값들을 처리하여 내부 api를 구성합니다
    if (this.props.validations) {
      this.validationsSync = this.props.validations.map((validation) => {
        if (typeof validation === 'object' && validation !== null && ('api' in validation || 'regex' in validation || 'async' in validation)) {
          return validation
        }
        if (typeof validation === 'string') {
          return this.getValidationByName(validation)
        }
        return null
      })
    }

    //validations에 존재하지 않지만 attribute에 구현된 validation을 구성합니다
    this.validationsSync = this.validationsSync || []
    const implementedAttrValdations = ['required', 'email', 'pattern', 'assertTrue', 'assertFalse']
    for (let i in implementedAttrValdations) {
      let name = implementedAttrValdations[i]
      if (!(this.props.validations && name in this.props.validations) && (this.props[name] || this.props.type === name)) {
        if (name === 'required')
          this.validationsSync.unshift(this.getValidationByName('required'))
        else {
          this.validationsSync.push(this.getValidationByName(name))
        }
      }
    }

    // 유효하지 않은 validation을 제거하고 async validation을 다른 변수로 할당시킵니다.
    this.validationAsync = null
    this.validationsSync = this.validationsSync.filter((validation) => {
      if (validation === null)
        return false
      if ('async' in validation) {
        this.validationAsync = validation
        return false
      }
      return true
    })

    console.log('Input constructor validationsSync', this.validationsSync)
    console.log('Input constructor validationAsync', this.validationAsync)

    // a sample of validation
    // let validation = {
    //   name: '',
    //   'regex/api': '',
    //   message: ''
    // }

    //bind events
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    this.state = {
      isTouched: false,
      validity: {
        name: '',
        status: true,
        message: '' // message는 true, false 또는 Promise
      }
    }
  }

  // attribute에서 주어진 값에 따라 validation 객체를 리턴합니다.
  getValidationByName(name) {
    switch (name) {
      case 'required':
        return {
          name: 'required',
          regex: /.+/,
          message: 'required'
        }
      case 'email':
        return {
          name: 'email',
          regex: /^[\w]+@[\w\.]*\w+$/,
          message: 'email'
        }
      case 'pattern':
        let pattern = this.props.pattern
        if (!pattern)
          return null
        return {
          name: 'pattern',
          regex: pattern,
          message: this.props.message || 'mismatch'
        }
      case 'assertTrue':
        let assertTrue = this.props.assertTrue
        if (!assertTrue)
          return null
        let tag = 'async' in assertTrue ? 'async' : 'api' in assertTrue ? 'api' : ''
        if (tag === '')
          return null
        return {
          name: 'assertTrue',
          [tag]: assertTrue[tag],
          message: assertTrue.message || 'againstAssertion'
        }
      case 'assertFalse':
        let assertFalse = this.props.assertFalse
        if (!assertFalse)
          return null
        let ftag = 'async' in assertFalse ? 'async' : 'api' in assertFalse ? 'api' : ''
        if (ftag === '')
          return null
        return {
          name: 'assertFalse',
          [ftag]: (value) => {
            return assertFalse[ftag](value)
          },
          message: assertFalse.message || 'againstAssertion'
        }
      default:
        return null
    }
  }

  componentDidMount() {
    console.log('Input componentDidMount')
    const name = this.name
    const value = this.props.value
    this.applyValidationResult(name, value, this.validate(value)) // this. validate returns { validationName : '' , validationStatus : true } if all validations are successful or there are no validation
  }

  // 리엑트의 공식 문서의 컴벤션으로 변경. onChange -> handleChange
  handleChange(e) {
    console.log('Input change')
    const { name, value } = e.target
    this.applyValidationResult(name, value, this.validateSync(value))
  }

  handleBlur(e) {
    console.log('Input blur')
    // handleChange에서 검증에 실패하여 status가 false라면 validateAsync를 suppress합니다.
    this.setState({ isTouched: true })
    if (this.state.validity.status === false)
      return
    // validationStatus가 Promise이더라도 표시될 메세지는 이미 결정되어 this.state에 저장됩니다.
    // validations중 Promise는 단 하나이어야 하며, 마지막에 위치해야합니다.
    const { name, value } = e.target
    this.applyValidationResult(name, value, this.validate(value))
  }

  applyValidationResult(name, value, validationResult) {
    if (validationResult === null)
      return
    const { validationName, validationStatus, validationMessage } = validationResult
    
    // 이 부분이 걱정되어서 rendering의 로그 순서를 확인하였고, form.js의 83, 84 라인의 promise 생성을 변경하여서도 테스트 해보았습니다. 
    // 동작이 이상합니다... 수정해야할 듯...
    if (validationStatus instanceof Promise) {
      console.log('xxxxx', validationResult)
      validationStatus.then((tf)=>{
        this.props.onInputValueChange(name, value, tf)
        this.setState({
          validity: {
            name: tf ? '' : validationName,
            status: tf,
            message: tf ? '' :validationMessage
          }
        })
      })
    }

    this.props.onInputValueChange(name, value, validationStatus)
    this.setState({
      validity: {
        name: validationName,
        status: validationStatus,
        message: validationMessage
      }
    })
  }

  // null은 구현된 validation이 없음을 의미합니다
  // null은 applyValidationResult에서 처리하지 않을 것입니다.
  validate(value) {
    const syncResult = this.validateSync(value)
    if (syncResult !== null && syncResult.validationStatus === false)
      return syncResult // synchronous 검증에 걸린 경우 리턴
    const asyncResult = this.validateAsync(value)
    if (syncResult !== null && asyncResult === null)
      return syncResult // async 검증이 존재하지 않을 경우, sync검증에 모두 통과한 결과를 리턴
    return asyncResult // sync 검증이 존재하는지 않는지 상관 없이, async 검증의 결과를 리턴, async 검증이 존재하지 않는다면 null

  }

  validateSync(value) {
    const validations = this.validationsSync
    if (!validations || validations.length === 0)
      return null
    for (let i = 0; i < validations.length; i++) {
      let validation = validations[i]
      if (('regex' in validation && validation.regex.test(value) === false)
        || ('api' in validation && validation.api() === false)
      ) {
        return {
          validationName: validation.name,
          validationStatus: false,
          validationMessage: validation.message,
        }
      }
    }
    return {
      validationName: '',
      validationStatus: true,
      validationMessage: ''
    }
  }

  validateAsync(value) {
    const validationAsync = this.validationAsync
    if (validationAsync)
      return {
        valdationName: validationAsync.name,
        validationStatus: validationAsync.async(),
        validationMessage: validationAsync.message
      }
    else
      return null
  }

  render() {
    //validity = validity instanceof Promise ? "loading" : validity
    // if (validity instanceof Promise) {
    //   validity = await validity
    // }
    // console.log(name, validity)
    // if (this.props.submitted){
    //   this.props.onValidatihandleChange(name, this.validate(name, value))
    // }
    console.log('Input render, props :', this.props)
    console.log('Input render, state :', this.state)
    const { value, disabled, isSubmitted } = this.props
    const isTouched = this.state.isTouched
    const message = typeof this.state.validity.status === 'boolean' ? this.state.validity.message : "loading"
    return (
      <div>
        {this.name} :&nbsp;
        <input
          name={this.name}
          value={value}
          type={this.type}
          disabled={disabled}
          // autoComplete={'true'}
          autoFocus={this.name === 'username' ? true : false}
          onChange={this.handleChange}
          onBlur={this.handleBlur} />
        {((isSubmitted === true || isTouched === true) && message !== '') ? message : undefined}
      </div>
    )
  }
}
