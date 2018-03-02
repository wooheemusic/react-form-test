import React, { Component } from 'react'

export default class Input extends Component {

  constructor(props) {
    super(props)

    this.name = this.props.name

    this.onChange = this.onChange.bind(this)
    this.onBlur = this.onBlur.bind(this)

    this.state = {
      counterValue : 1
    }
  }

  componentDidMount() {
    console.log('mounted')
    const {name, value} = this.props
    this.props.onValidationChange(name, this.validatePattern(name, value))
  }

  onChange(e) {
    console.log('Input change')
    const {name, value} = e.target
    console.log(this.props.value, value)
    this.setState((prev, props)=> {
      console.log(props.value, value)
      return { counterValue : ++prev.counterValue} } ) 
    this.props.onValueChange(name, value )
  }

  onBlur(e) {
    console.log('Input blur', e.target)
    const {name, value} = e.target
    this.props.onValidationChange(name, this.validatePattern(name, value))
  }

  validatePattern(name, value) {
    switch (name) {
      case "username":
        // return /^[\w]+@[\w\.]\w+$/.test(value)
        const that = this
        return new Promise((s, f) => { setTimeout(()=>{s('hello')}, 5000) })
          .then((v)=>{
            this.props.onValidationChange(name,v)
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
