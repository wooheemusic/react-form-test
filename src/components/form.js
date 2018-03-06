import React, { Component } from 'react'
import { Button } from 'reactstrap'
import Input from 'components/input'


/**
 * 필연적인 조건
submit event발생 시, 모든 validation은 완료되어 있어야 합니다.

제시된 조건
validation은 input blur event가 수행합니다.
message의 결정은 input render에서 합니다.

리펙토링의 이유 : React의 전략에 반합니다.
blur event에서의 validation result는 form submit event발생 시 form component가 알고 있어야하므로  single source of truth 전략에 의해 lifting해야합니다. blur event가 아니더라도 어떠한 validation이든 결과가 lifting되어야 하므로, render method안에서 사용할 수 없습니다. (무한루프)

리펙토링 제안 : 
validation과 messaging을 분리합니다.
그리고 Input과 form은 결합도가 높으므로 form은 extend해서 사용하도록 합니다.

새로운 이슈:
submit event 발생 시, validation이 각 항목에 관해 모두 수행되지 않았을 때, 각 항목들이 required 여부에 따라서 validation result가 없어도 validation을 결정할 수 있어야 합니다. 
 이 경우는, Input의 attr에 [‘required’ , ‘vpc’] 형태로 구현해서는 안되며, form의 constructor에서 this.state = {validations : { username : [‘required’ , ‘email’] }, … }, input attr에서 validation={this.state.validations}과 같이 정의하여, form이 Input의 validation 설정을 읽을 수 있게 하고, 아직 validation을 하지 않은 각 input 항목에 관해 required를 체크하여 submit 가능 여부를 체크하여야 할 것입니다.
  아니면 그냥 componentDidMount에서 하면 되겠군요;

그런데 만약에 자동완성이 구현되어 있다면, 그 항목에 관하여 validation이 수행되어야하는데, 아직 blur event에 validation이 수행되어 있지않았다면, input안에 정의된 validation에 관련된 method를 수행해야하는데, 이 때 그 method를 수행하는 한가지 방법은, form component에서 render를 수행하여 input의 render를 수행하게 하는 것인데, render method안에서는 위에서 언급한 lifting이 불가한 이유로 validation을 수행 할 수 없습니다. 이 경우는 Input componentDidMount를 이용하여 validation을 수행해야 할 것입니다.
 * 
 * 
 */


export default class Form extends Component {

  constructor(props) {
    super(props)

    this.onSubmit = this.onSubmit.bind(this)
    this.onInputValueChange = this.onInputValueChange.bind(this)

    this.state = {
      isLoading: false,
      isSubmitted: false,
      values: {
        username: '12123@wdwd',
        password: ''
      },
      validities: {
        username: true,
        password: true
      }
    }
  }

  onInputValueChange(name, value, validity) {
    this.setState((prev) => {
      let values = Object.assign(prev.values, { [name]: value })
      let validities = Object.assign(prev.validities, { [name]: validity })
      return { values, validities }
    })
  }

  // 네... submit event 에서도 rendering이 필요하므로 await할 수가 없을 것입니다...;
  // promise로 처리해야겠습니다.
  onSubmit(e) {
    e.preventDefault()
    console.log('Form submitted')

    const validities = this.state.validities

    this.setState({ 
      isLoading: true,
      isSubmitted: true
    })

    for (let i in validities) {
      //this.setState({ isSubmitted: true })
      let validity = this.state.validities[i]
      console.log('Form submit validity', i, validity)

    }

    
    // await 할 경우 loading에 관한 렌더링이 막힐 듯....
  }

  processSubmission() {
    
    
  }

  submissionComplete() {
    this.setState({ 
      isLoading: false,
    })
  }

  render() {
    console.log('Form render, this.state.validities :', this.state.validities)
    const testAsyncApi = ()=>(new Promise((s,f)=>{ setTimeout(()=>{s(true)},2000)  }))
    // const testAsyncApi = ()=>(new Promise((s,f)=>{ s(true)  }))
    return (
      <form onSubmit={this.onSubmit}>
        { this.props.isSubmitted ? 'isSubmitted' : undefined}
        { this.props.isLoading ? 'isLoading' : undefined}
        <Input
          name="username"
          type="email"
          required
          //validations={[ 'email', 'xx']}
          assertTrue={{async : testAsyncApi , message : "xxxxxx"}}
          value={this.state.values.username}
          disabled={this.state.isLoading || this.state.validities.username instanceof Promise}
          isSubmitted={this.state.isSubmitted}
          onInputValueChange={this.onInputValueChange}
        />
        <Input
          name="password"
          type="password"
          required
          value={this.state.values.password} 
          disabled={this.state.isLoading}
          isSubmitted={this.state.isSubmitted} 
          onInputValueChange={this.onInputValueChange} 
        />
        <Button disabled={this.state.isLoading}> submit </ Button>
      </form>
    )
  }
}
